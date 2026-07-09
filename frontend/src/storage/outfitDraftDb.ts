import type { ChatMessage, InputMode, OutfitChatMemory, OutfitGenerationRecord, OutfitSelection } from "../types/outfit";

const DB_NAME = "ai-cartoon-avatar";
const DB_VERSION = 3;
const DRAFT_STORE_NAME = "drafts";
const AVATAR_RECORD_STORE_NAME = "generation-records";
const RECORD_STORE_NAME = "outfit-generation-records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(AVATAR_RECORD_STORE_NAME)) {
        db.createObjectStore(AVATAR_RECORD_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(RECORD_STORE_NAME)) {
        db.createObjectStore(RECORD_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isSourceMode(value: unknown): value is InputMode {
  return value === "image" || value === "chat";
}

function isOutfitSelection(value: unknown): value is OutfitSelection {
  if (!value || typeof value !== "object") return false;
  const selection = value as Partial<Record<keyof OutfitSelection, unknown>>;
  return (
    typeof selection.hair === "string" &&
    typeof selection.top === "string" &&
    typeof selection.bottom === "string" &&
    typeof selection.shoes === "string"
  );
}

function normalizeMessages(value: unknown): ChatMessage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const message = item as Partial<ChatMessage>;
      return (message.role === "user" || message.role === "assistant") && typeof message.content === "string";
    })
    .map((message) => ({ role: message.role, content: message.content }));
}

function normalizeChatMemory(value: unknown): OutfitChatMemory | undefined {
  if (!value || typeof value !== "object") return undefined;
  const memory = value as Partial<OutfitChatMemory>;
  return {
    summary: typeof memory.summary === "string" ? memory.summary : "",
    known_features: memory.known_features ?? {},
    notes: Array.isArray(memory.notes) ? memory.notes.filter((note): note is string => typeof note === "string") : []
  };
}

function normalizeRecord(raw: unknown): OutfitGenerationRecord | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const record = raw as Partial<OutfitGenerationRecord> & Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.createdAt !== "string" ||
    !isSourceMode(record.sourceMode) ||
    typeof record.provider !== "string" ||
    !isOutfitSelection(record.features) ||
    !isOutfitSelection(record.generatedSelection) ||
    !isOutfitSelection(record.currentSelection) ||
    typeof record.action !== "string" ||
    !record.analysis ||
    typeof record.analysis !== "object"
  ) {
    return undefined;
  }

  return {
    id: record.id,
    createdAt: record.createdAt,
    sourceMode: record.sourceMode,
    provider: record.provider,
    uploadedImageDataUrl: typeof record.uploadedImageDataUrl === "string" ? record.uploadedImageDataUrl : undefined,
    messages: normalizeMessages(record.messages),
    chatMemory: normalizeChatMemory(record.chatMemory),
    features: record.features,
    generatedSelection: record.generatedSelection,
    currentSelection: record.currentSelection,
    action: record.action as OutfitGenerationRecord["action"],
    analysis: record.analysis as OutfitGenerationRecord["analysis"]
  };
}

export async function listOutfitGenerationRecords(): Promise<OutfitGenerationRecord[]> {
  const db = await openDb();
  const records = await new Promise<OutfitGenerationRecord[]>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE_NAME, "readonly");
    const request = transaction.objectStore(RECORD_STORE_NAME).getAll();
    request.onsuccess = () => {
      resolve(
        request.result
          .map(normalizeRecord)
          .filter((record): record is OutfitGenerationRecord => Boolean(record))
          .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      );
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records;
}

export async function addOutfitGenerationRecord(record: OutfitGenerationRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE_NAME, "readwrite");
    transaction.objectStore(RECORD_STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function deleteOutfitGenerationRecord(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE_NAME, "readwrite");
    transaction.objectStore(RECORD_STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
