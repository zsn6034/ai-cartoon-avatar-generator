from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


FaceShape = Literal["oval", "round", "square", "heart"]
EyeSize = Literal["small", "medium", "large"]
EyeLid = Literal["monolid", "double", "hooded"]
BrowThickness = Literal["thin", "medium", "thick"]
NoseBridge = Literal["low", "medium", "high"]
LipFullness = Literal["thin", "medium", "full"]
SkinTone = Literal["fair", "light", "medium", "tan", "deep"]
HairLength = Literal["short", "medium", "long"]
HairShape = Literal["straight", "wavy"]
Bangs = Literal["yes", "no"]
Expression = Literal["neutral", "smile", "cool", "soft"]
PresentationStyle = Literal["masculine", "feminine", "androgynous"]


FEATURE_KEYS = [
    "face_shape",
    "eye_size",
    "eye_lid",
    "brow_thickness",
    "nose_bridge",
    "lip_fullness",
    "skin_tone",
    "hair_length",
    "hair_shape",
    "bangs",
    "expression",
    "presentation_style",
]


class FaceFeatures(BaseModel):
    face_shape: FaceShape
    eye_size: EyeSize
    eye_lid: EyeLid
    brow_thickness: BrowThickness
    nose_bridge: NoseBridge
    lip_fullness: LipFullness
    skin_tone: SkinTone
    hair_length: HairLength
    hair_shape: HairShape
    bangs: Bangs
    expression: Expression
    presentation_style: PresentationStyle


class PartialFaceFeatures(BaseModel):
    face_shape: Optional[FaceShape] = None
    eye_size: Optional[EyeSize] = None
    eye_lid: Optional[EyeLid] = None
    brow_thickness: Optional[BrowThickness] = None
    nose_bridge: Optional[NoseBridge] = None
    lip_fullness: Optional[LipFullness] = None
    skin_tone: Optional[SkinTone] = None
    hair_length: Optional[HairLength] = None
    hair_shape: Optional[HairShape] = None
    bangs: Optional[Bangs] = None
    expression: Optional[Expression] = None
    presentation_style: Optional[PresentationStyle] = None


class FeatureReason(BaseModel):
    feature: str
    value: str
    reason: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatAnalyzeRequest(BaseModel):
    provider: Literal["qwen", "doubao"]
    messages: List[ChatMessage]
    current_features: PartialFaceFeatures = Field(default_factory=PartialFaceFeatures)
    round_index: int = Field(ge=1, le=3)


class AnalysisResponse(BaseModel):
    status: Literal["need_more_info", "ready"]
    assistant_message: str
    features: PartialFaceFeatures
    confidence: Dict[str, float]
    reasons: List[FeatureReason]
    missing_fields: List[str]
    defaults_applied: List[str]
    provider: Literal["qwen", "doubao"]


DEFAULT_FEATURES = FaceFeatures(
    face_shape="oval",
    eye_size="medium",
    eye_lid="double",
    brow_thickness="medium",
    nose_bridge="medium",
    lip_fullness="medium",
    skin_tone="light",
    hair_length="medium",
    hair_shape="straight",
    bangs="no",
    expression="neutral",
    presentation_style="androgynous",
)
