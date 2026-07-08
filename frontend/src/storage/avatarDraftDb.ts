import type { AvatarSelection, ChatMemory, ChatMessage, GenerationRecord, InputMode } from "../types/face";

const DB_NAME = "ai-cartoon-avatar";
const DB_VERSION = 2;
const DRAFT_STORE_NAME = "drafts";
const RECORD_STORE_NAME = "generation-records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME);
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

function isAvatarSelection(value: unknown): value is AvatarSelection {
  if (!value || typeof value !== "object") return false;
  const selection = value as Partial<Record<keyof AvatarSelection, unknown>>;
  return (
    typeof selection.hair === "string" &&
    typeof selection.eyes === "string" &&
    typeof selection.eyebrows === "string" &&
    typeof selection.mouth === "string" &&
    typeof selection.hairColor === "string" &&
    typeof selection.skinColor === "string" &&
    typeof selection.details === "string" &&
    typeof selection.glasses === "string" &&
    typeof selection.earrings === "string"
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

function normalizeChatMemory(value: unknown): ChatMemory | undefined {
  if (!value || typeof value !== "object") return undefined;
  const memory = value as Partial<ChatMemory>;
  return {
    summary: typeof memory.summary === "string" ? memory.summary : "",
    known_features: memory.known_features ?? {},
    notes: Array.isArray(memory.notes) ? memory.notes.filter((note): note is string => typeof note === "string") : []
  };
}

function normalizeRecord(raw: unknown): GenerationRecord | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const record = raw as Partial<GenerationRecord> & Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.createdAt !== "string" ||
    !isSourceMode(record.sourceMode) ||
    typeof record.provider !== "string" ||
    !isAvatarSelection(record.features) ||
    !isAvatarSelection(record.generatedSelection) ||
    !isAvatarSelection(record.currentSelection) ||
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
    analysis: record.analysis as GenerationRecord["analysis"]
  };
}

export async function listGenerationRecords(): Promise<GenerationRecord[]> {
  const db = await openDb();
  const records = await new Promise<GenerationRecord[]>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE_NAME, "readonly");
    const request = transaction.objectStore(RECORD_STORE_NAME).getAll();
    request.onsuccess = () => {
      resolve(
        request.result
          .map(normalizeRecord)
          .filter((record): record is GenerationRecord => Boolean(record))
          .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      );
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records;
}

export async function addGenerationRecord(record: GenerationRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE_NAME, "readwrite");
    transaction.objectStore(RECORD_STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function deleteGenerationRecord(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE_NAME, "readwrite");
    transaction.objectStore(RECORD_STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
