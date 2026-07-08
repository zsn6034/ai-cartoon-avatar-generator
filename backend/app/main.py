import json
import logging
import time

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.face import AnalysisResponse, ChatGenerateRequest, ChatRememberRequest, ChatRememberResponse, LLMConfig
from app.services.image_analysis import image_to_data_url
from app.services.provider_factory import get_provider, list_providers

settings = get_settings()
logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
    handler.setLevel(logging.INFO)
    logger.addHandler(handler)

app = FastAPI(title="AI Cartoon Avatar Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    started = time.perf_counter()
    logger.info("[api] --> %s %s", request.method, request.url.path)
    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.exception("[api] !! %s %s failed elapsed_ms=%.1f", request.method, request.url.path, elapsed_ms)
        raise

    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "[api] <-- %s %s status=%s elapsed_ms=%.1f",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.get("/api/health")
async def health():
    logger.info("[api.health] ok")
    return {"status": "ok"}


@app.get("/api/providers")
async def providers():
    result = list_providers()
    provider_items = result.get("providers", []) if isinstance(result, dict) else result
    provider_ids = [
        item.get("id") if isinstance(item, dict) else str(item)
        for item in provider_items
    ]
    logger.info(
        "[api.providers] default=%s count=%d providers=%s",
        result.get("default_provider") if isinstance(result, dict) else None,
        len(provider_items),
        provider_ids,
    )
    return result


@app.post("/api/analyze/image", response_model=AnalysisResponse)
async def analyze_image(llm_config: str = Form(...), image: UploadFile = File(...)):
    try:
        config = LLMConfig.model_validate(json.loads(llm_config))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=422, detail="Invalid llm_config") from exc

    logger.info(
        "[api.image] request provider=%s model=%s base_url=%s filename=%s content_type=%s size=%s",
        config.provider,
        config.model,
        config.base_url,
        image.filename,
        image.content_type,
        getattr(image, "size", None),
    )
    selected_provider = get_provider(config)
    data_url = await image_to_data_url(image)
    result = await selected_provider.analyze_image(data_url)
    logger.info(
        "[api.image] response provider=%s status=%s features=%s defaults_applied=%s",
        config.provider,
        result.status,
        result.features.model_dump(),
        result.defaults_applied,
    )
    return result


@app.post("/api/chat/remember", response_model=ChatRememberResponse, response_model_exclude_none=True)
async def remember_chat(request: ChatRememberRequest):
    selected_provider = get_provider(request.llm_config)
    messages = [message.model_dump() for message in request.messages]
    current_memory = request.current_memory.model_dump(exclude_none=True)
    logger.info(
        "[api.remember] request provider=%s model=%s base_url=%s messages=%d current_summary=%r current_notes=%d",
        request.llm_config.provider,
        request.llm_config.model,
        request.llm_config.base_url,
        len(messages),
        current_memory.get("summary", ""),
        len(current_memory.get("notes", [])),
    )
    result = await selected_provider.remember_chat(
        messages=messages,
        current_memory=current_memory,
    )
    logger.info(
        "[api.remember] response provider=%s summary=%r notes=%d known_features=%s",
        request.llm_config.provider,
        result.chat_memory.summary,
        len(result.chat_memory.notes),
        result.chat_memory.known_features.model_dump(exclude_none=True),
    )
    return result


@app.post("/api/chat/generate", response_model=AnalysisResponse)
async def generate_chat(request: ChatGenerateRequest):
    selected_provider = get_provider(request.llm_config)
    messages = [message.model_dump() for message in request.messages]
    chat_memory = request.chat_memory.model_dump(exclude_none=True)
    logger.info(
        "[api.generate] request provider=%s model=%s base_url=%s messages=%d memory_summary=%r memory_notes=%d",
        request.llm_config.provider,
        request.llm_config.model,
        request.llm_config.base_url,
        len(messages),
        chat_memory.get("summary", ""),
        len(chat_memory.get("notes", [])),
    )
    result = await selected_provider.generate_chat(
        messages=messages,
        chat_memory=chat_memory,
    )
    logger.info(
        "[api.generate] response provider=%s status=%s features=%s defaults_applied=%s",
        request.llm_config.provider,
        result.status,
        result.features.model_dump(),
        result.defaults_applied,
    )
    return result
