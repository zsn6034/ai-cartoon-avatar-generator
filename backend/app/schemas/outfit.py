from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.face import ChatMessage, FeatureReason, LLMConfig


HairAsset = Literal["hair1", "hair2", "hair3", "hair4", "hair5", "hair6", "hair7"]
TopAsset = Literal["top1", "top2", "top3", "top4", "top5", "top6", "top7", "top8", "top9"]
BottomAsset = Literal["bottom1", "bottom2", "bottom3", "bottom4", "bottom5", "bottom6", "bottom7"]
ShoesAsset = Literal["shoes1", "shoes2", "shoes3", "shoes4", "shoes5", "shoes6", "shoes7"]


OUTFIT_FEATURE_KEYS = ["hair", "top", "bottom", "shoes"]

ALLOWED_OUTFIT_VALUES = {
    "hair": {"hair1", "hair2", "hair3", "hair4", "hair5", "hair6", "hair7"},
    "top": {"top1", "top2", "top3", "top4", "top5", "top6", "top7", "top8", "top9"},
    "bottom": {"bottom1", "bottom2", "bottom3", "bottom4", "bottom5", "bottom6", "bottom7"},
    "shoes": {"shoes1", "shoes2", "shoes3", "shoes4", "shoes5", "shoes6", "shoes7"},
}


class OutfitFeatures(BaseModel):
    hair: HairAsset
    top: TopAsset
    bottom: BottomAsset
    shoes: ShoesAsset


class PartialOutfitFeatures(BaseModel):
    hair: Optional[HairAsset] = None
    top: Optional[TopAsset] = None
    bottom: Optional[BottomAsset] = None
    shoes: Optional[ShoesAsset] = None


class OutfitChatMemory(BaseModel):
    summary: str = ""
    known_features: PartialOutfitFeatures = Field(default_factory=PartialOutfitFeatures)
    notes: List[str] = Field(default_factory=list)


class OutfitChatRememberRequest(BaseModel):
    llm_config: LLMConfig
    messages: List[ChatMessage]
    current_memory: OutfitChatMemory = Field(default_factory=OutfitChatMemory)


class OutfitChatGenerateRequest(BaseModel):
    llm_config: LLMConfig
    messages: List[ChatMessage]
    chat_memory: OutfitChatMemory = Field(default_factory=OutfitChatMemory)


class OutfitChatRememberResponse(BaseModel):
    assistant_message: str
    chat_memory: OutfitChatMemory
    confidence: Dict[str, float]
    reasons: List[FeatureReason]
    provider: str


class OutfitAnalysisResponse(BaseModel):
    status: Literal["ready"]
    assistant_message: str
    features: OutfitFeatures
    confidence: Dict[str, float]
    reasons: List[FeatureReason]
    missing_fields: List[str]
    defaults_applied: List[str]
    provider: str


DEFAULT_OUTFIT_FEATURES = OutfitFeatures(
    hair="hair1",
    top="top1",
    bottom="bottom1",
    shoes="shoes1",
)
