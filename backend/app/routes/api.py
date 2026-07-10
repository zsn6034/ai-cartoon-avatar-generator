import json
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from app.schemas.face import AnalysisResponse, ChatGenerateRequest, ChatRememberRequest, ChatRememberResponse, LLMConfig
from app.schemas.outfit import (
    OutfitAnalysisResponse,
    OutfitChatGenerateRequest,
    OutfitChatRememberRequest,
    OutfitChatRememberResponse,
)
from app.services.avatar_analysis import AvatarAnalysisService
from app.services.image_analysis import image_to_data_url
from app.services.outfit_analysis import OutfitAnalysisService
from app.services.provider_factory import get_provider, list_providers


router = APIRouter()
logger = logging.getLogger("uvicorn.error")


@router.get("/api/health")
async def health():
    logger.info("[api.health] ok")
    return {"status": "ok"}


@router.get("/api/providers")
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


@router.post("/api/analyze/image", response_model=AnalysisResponse)
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
    service = AvatarAnalysisService(get_provider(config))
    data_url = await image_to_data_url(image)
    result = await service.analyze_image(data_url)
    logger.info(
        "[api.image] response provider=%s status=%s features=%s defaults_applied=%s",
        config.provider,
        result.status,
        result.features.model_dump(),
        result.defaults_applied,
    )
    return result


@router.post("/api/chat/remember", response_model=ChatRememberResponse, response_model_exclude_none=True)
async def remember_chat(request: ChatRememberRequest):
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
    service = AvatarAnalysisService(get_provider(request.llm_config))
    result = await service.remember_chat(messages=messages, current_memory=current_memory)
    logger.info(
        "[api.remember] response provider=%s summary=%r notes=%d known_features=%s",
        request.llm_config.provider,
        result.chat_memory.summary,
        len(result.chat_memory.notes),
        result.chat_memory.known_features.model_dump(exclude_none=True),
    )
    return result


@router.post("/api/chat/generate", response_model=AnalysisResponse)
async def generate_chat(request: ChatGenerateRequest):
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
    service = AvatarAnalysisService(get_provider(request.llm_config))
    result = await service.generate_chat(messages=messages, chat_memory=chat_memory)
    logger.info(
        "[api.generate] response provider=%s status=%s features=%s defaults_applied=%s",
        request.llm_config.provider,
        result.status,
        result.features.model_dump(),
        result.defaults_applied,
    )
    return result


@router.post("/api/outfit/analyze/image", response_model=OutfitAnalysisResponse)
async def analyze_outfit_image(llm_config: str = Form(...), image: UploadFile = File(...)):
    try:
        config = LLMConfig.model_validate(json.loads(llm_config))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=422, detail="Invalid llm_config") from exc

    logger.info(
        "[api.outfit.image] request provider=%s model=%s base_url=%s filename=%s content_type=%s size=%s",
        config.provider,
        config.model,
        config.base_url,
        image.filename,
        image.content_type,
        getattr(image, "size", None),
    )
    service = OutfitAnalysisService(get_provider(config))
    data_url = await image_to_data_url(image)
    result = await service.analyze_image(data_url)
    logger.info(
        "[api.outfit.image] response provider=%s status=%s features=%s defaults_applied=%s",
        config.provider,
        result.status,
        result.features.model_dump(),
        result.defaults_applied,
    )
    return result


@router.post("/api/outfit/chat/remember", response_model=OutfitChatRememberResponse, response_model_exclude_none=True)
async def remember_outfit_chat(request: OutfitChatRememberRequest):
    messages = [message.model_dump() for message in request.messages]
    current_memory = request.current_memory.model_dump(exclude_none=True)
    logger.info(
        "[api.outfit.remember] request provider=%s model=%s base_url=%s messages=%d current_summary=%r current_notes=%d",
        request.llm_config.provider,
        request.llm_config.model,
        request.llm_config.base_url,
        len(messages),
        current_memory.get("summary", ""),
        len(current_memory.get("notes", [])),
    )
    service = OutfitAnalysisService(get_provider(request.llm_config))
    result = await service.remember_chat(messages=messages, current_memory=current_memory)
    logger.info(
        "[api.outfit.remember] response provider=%s summary=%r notes=%d known_features=%s",
        request.llm_config.provider,
        result.chat_memory.summary,
        len(result.chat_memory.notes),
        result.chat_memory.known_features.model_dump(exclude_none=True),
    )
    return result


@router.post("/api/outfit/chat/generate", response_model=OutfitAnalysisResponse)
async def generate_outfit_chat(request: OutfitChatGenerateRequest):
    messages = [message.model_dump() for message in request.messages]
    chat_memory = request.chat_memory.model_dump(exclude_none=True)
    logger.info(
        "[api.outfit.generate] request provider=%s model=%s base_url=%s messages=%d memory_summary=%r memory_notes=%d",
        request.llm_config.provider,
        request.llm_config.model,
        request.llm_config.base_url,
        len(messages),
        chat_memory.get("summary", ""),
        len(chat_memory.get("notes", [])),
    )
    service = OutfitAnalysisService(get_provider(request.llm_config))
    result = await service.generate_chat(messages=messages, chat_memory=chat_memory)
    logger.info(
        "[api.outfit.generate] response provider=%s status=%s features=%s defaults_applied=%s",
        request.llm_config.provider,
        result.status,
        result.features.model_dump(),
        result.defaults_applied,
    )
    return result
