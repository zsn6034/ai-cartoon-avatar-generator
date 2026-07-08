from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


HairVariant = Literal[
    "long01",
    "long02",
    "long03",
    "long04",
    "long05",
    "long06",
    "long07",
    "long08",
    "long09",
    "long10",
    "long11",
    "long12",
    "long13",
    "long14",
    "long15",
    "long16",
    "long17",
    "long18",
    "long19",
    "long20",
    "long21",
    "long22",
    "long23",
    "long24",
    "long25",
    "long26",
    "short01",
    "short02",
    "short03",
    "short04",
    "short05",
    "short06",
    "short07",
    "short08",
    "short09",
    "short10",
    "short11",
    "short12",
    "short13",
    "short14",
    "short15",
    "short16",
    "short17",
    "short18",
    "short19",
]
Variant26 = Literal[
    "variant01",
    "variant02",
    "variant03",
    "variant04",
    "variant05",
    "variant06",
    "variant07",
    "variant08",
    "variant09",
    "variant10",
    "variant11",
    "variant12",
    "variant13",
    "variant14",
    "variant15",
    "variant16",
    "variant17",
    "variant18",
    "variant19",
    "variant20",
    "variant21",
    "variant22",
    "variant23",
    "variant24",
    "variant25",
    "variant26",
]
EyebrowVariant = Literal[
    "variant01",
    "variant02",
    "variant03",
    "variant04",
    "variant05",
    "variant06",
    "variant07",
    "variant08",
    "variant09",
    "variant10",
    "variant11",
    "variant12",
    "variant13",
    "variant14",
    "variant15",
]
MouthVariant = Literal[
    "variant01",
    "variant02",
    "variant03",
    "variant04",
    "variant05",
    "variant06",
    "variant07",
    "variant08",
    "variant09",
    "variant10",
    "variant11",
    "variant12",
    "variant13",
    "variant14",
    "variant15",
    "variant16",
    "variant17",
    "variant18",
    "variant19",
    "variant20",
    "variant21",
    "variant22",
    "variant23",
    "variant24",
    "variant25",
    "variant26",
    "variant27",
    "variant28",
    "variant29",
    "variant30",
]
DetailVariant = Literal["none", "birthmark", "blush", "freckles", "mustache"]
GlassesVariant = Literal["none", "variant01", "variant02", "variant03", "variant04", "variant05"]
EarringsVariant = Literal["none", "variant01", "variant02", "variant03", "variant04", "variant05", "variant06"]
HairColor = Literal[
    "#0e0e0e",
    "#e5d7a3",
    "#b9a05f",
    "#796a45",
    "#85c2c6",
    "#6a4e35",
    "#562306",
    "#afafaf",
    "#3eac2c",
    "#dba3be",
    "#592454",
    "#ac6511",
    "#cb6820",
    "#ab2a18",
]
SkinColor = Literal["#f2d3b1", "#ecad80", "#9e5622", "#763900"]


FEATURE_KEYS = [
    "hair",
    "eyes",
    "eyebrows",
    "mouth",
    "hairColor",
    "skinColor",
    "details",
    "glasses",
    "earrings",
]

ALLOWED_FEATURE_VALUES = {
    "hair": {
        "long01",
        "long02",
        "long03",
        "long04",
        "long05",
        "long06",
        "long07",
        "long08",
        "long09",
        "long10",
        "long11",
        "long12",
        "long13",
        "long14",
        "long15",
        "long16",
        "long17",
        "long18",
        "long19",
        "long20",
        "long21",
        "long22",
        "long23",
        "long24",
        "long25",
        "long26",
        "short01",
        "short02",
        "short03",
        "short04",
        "short05",
        "short06",
        "short07",
        "short08",
        "short09",
        "short10",
        "short11",
        "short12",
        "short13",
        "short14",
        "short15",
        "short16",
        "short17",
        "short18",
        "short19",
    },
    "eyes": {f"variant{i:02d}" for i in range(1, 27)},
    "eyebrows": {f"variant{i:02d}" for i in range(1, 16)},
    "mouth": {f"variant{i:02d}" for i in range(1, 31)},
    "hairColor": {
        "#0e0e0e",
        "#e5d7a3",
        "#b9a05f",
        "#796a45",
        "#85c2c6",
        "#6a4e35",
        "#562306",
        "#afafaf",
        "#3eac2c",
        "#dba3be",
        "#592454",
        "#ac6511",
        "#cb6820",
        "#ab2a18",
    },
    "skinColor": {"#f2d3b1", "#ecad80", "#9e5622", "#763900"},
    "details": {"none", "birthmark", "blush", "freckles", "mustache"},
    "glasses": {"none", "variant01", "variant02", "variant03", "variant04", "variant05"},
    "earrings": {"none", "variant01", "variant02", "variant03", "variant04", "variant05", "variant06"},
}


class AvatarFeatures(BaseModel):
    hair: HairVariant
    eyes: Variant26
    eyebrows: EyebrowVariant
    mouth: MouthVariant
    hairColor: HairColor
    skinColor: SkinColor
    details: DetailVariant
    glasses: GlassesVariant
    earrings: EarringsVariant


class PartialAvatarFeatures(BaseModel):
    hair: Optional[HairVariant] = None
    eyes: Optional[Variant26] = None
    eyebrows: Optional[EyebrowVariant] = None
    mouth: Optional[MouthVariant] = None
    hairColor: Optional[HairColor] = None
    skinColor: Optional[SkinColor] = None
    details: Optional[DetailVariant] = None
    glasses: Optional[GlassesVariant] = None
    earrings: Optional[EarringsVariant] = None


class ChatMemory(BaseModel):
    summary: str = ""
    known_features: PartialAvatarFeatures = Field(default_factory=PartialAvatarFeatures)
    notes: List[str] = Field(default_factory=list)


class FeatureReason(BaseModel):
    feature: str
    value: str
    reason: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class LLMConfig(BaseModel):
    provider: str = Field(min_length=1)
    model: str = Field(min_length=1)
    api_key: str = Field(min_length=1)
    base_url: str = Field(min_length=1)


class ChatRememberRequest(BaseModel):
    llm_config: LLMConfig
    messages: List[ChatMessage]
    current_memory: ChatMemory = Field(default_factory=ChatMemory)


class ChatGenerateRequest(BaseModel):
    llm_config: LLMConfig
    messages: List[ChatMessage]
    chat_memory: ChatMemory = Field(default_factory=ChatMemory)


class ChatRememberResponse(BaseModel):
    assistant_message: str
    chat_memory: ChatMemory
    confidence: Dict[str, float]
    reasons: List[FeatureReason]
    provider: str


class AnalysisResponse(BaseModel):
    status: Literal["ready"]
    assistant_message: str
    features: AvatarFeatures
    confidence: Dict[str, float]
    reasons: List[FeatureReason]
    missing_fields: List[str]
    defaults_applied: List[str]
    provider: str


DEFAULT_FEATURES = AvatarFeatures(
    hair="short01",
    eyes="variant01",
    eyebrows="variant04",
    mouth="variant09",
    hairColor="#0e0e0e",
    skinColor="#f2d3b1",
    details="none",
    glasses="none",
    earrings="none",
)
