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

OUTFIT_VALUE_DESCRIPTIONS = {
    "hair": {
        "hair1": "发型1：深黑色短发，厚刘海，两侧有下垂发束，适合黑色短发、厚短发",
        "hair2": "发型2：棕色短发，整体圆润包头，适合棕色圆润短发、乖巧短发",
        "hair3": "发型3：金棕色短发，偏侧分轮廓，适合金发、浅棕发、侧分短发",
        "hair4": "发型4：黑蓝色短发，顶部更蓬松，适合深色蓬松短发、凌乱短发",
        "hair5": "发型5：暗紫色短发，层次感更明显，适合紫色短发、活泼层次短发",
        "hair6": "发型6：深绿色短发，上翘感更强，适合绿色短发、个性翘发",
        "hair7": "发型7：橙红色短发，造型更醒目，适合橙红发、暖色短发、夸张短发",
    },
    "top": {
        "top1": "上衣1：米白色长袖上衣，针织纹理感，带斜挎带装饰，适合白色/米白长袖、针织上衣",
        "top2": "上衣2：绿色上衣，适合绿色上装、深绿休闲上衣",
        "top3": "上衣3：砖红色上衣，适合红色/暖红上装",
        "top4": "上衣4：蓝色上衣，适合蓝色上装、冷色上衣",
        "top5": "上衣5：黑色上衣，适合黑色上装、深色上衣",
        "top6": "上衣6：黄棕色上衣，适合黄色/橙黄色/卡其色上装",
        "top7": "上衣7：灰紫色上衣，适合灰紫、薰衣草灰、低饱和紫色上装",
        "top8": "上衣8：亮黄色上衣，适合黄色、明亮醒目的上装",
        "top9": "上衣9：酒红色上衣，适合深红、玫红、紫红色上装",
    },
    "bottom": {
        "bottom1": "下装1：蓝绿色中长裙装轮廓，适合蓝绿色裙子、半身裙、裙装下装",
        "bottom2": "下装2：卡其棕色下装，适合棕色/卡其色下装",
        "bottom3": "下装3：深蓝色下装，适合蓝色、藏蓝色下装",
        "bottom4": "下装4：深灰绿色下装，适合深灰、墨绿、低调深色下装",
        "bottom5": "下装5：棕灰色下装，适合灰棕、暖灰、低饱和棕色下装",
        "bottom6": "下装6：深绿色下装，适合绿色、深绿下装",
        "bottom7": "下装7：暗紫色下装，适合紫色、深紫、暗色个性下装",
    },
    "shoes": {
        "shoes1": "鞋子1：黑色鞋，鞋口较高，短靴感，适合黑色鞋、黑色靴子、深色鞋",
        "shoes2": "鞋子2：米白色浅色鞋，适合白色/米白鞋、浅色鞋",
        "shoes3": "鞋子3：棕色鞋，适合棕色、咖啡色鞋",
        "shoes4": "鞋子4：深灰色鞋，适合灰色、黑灰色鞋",
        "shoes5": "鞋子5：红棕色鞋，适合棕红、暖棕色鞋",
        "shoes6": "鞋子6：深蓝色鞋，适合蓝色、藏蓝色鞋",
        "shoes7": "鞋子7：暖红色鞋，适合红色、橙红色醒目鞋",
    },
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
