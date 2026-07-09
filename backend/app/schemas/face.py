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

FEATURE_VALUE_DESCRIPTIONS = {
    "hair": {
        "long01": "长发01：齐肩直发，侧分斜刘海，发尾外斜，适合中长直发、斜刘海、利落波波头",
        "long02": "长发02：双侧低马尾或短双辫，齐碎刘海，头顶小翘发，适合俏皮双马尾",
        "long03": "长发03：双侧低马尾，齐碎刘海，花环头饰，适合带花环或头花的发型",
        "long04": "长发04：中长层次直发，长斜刘海，发束凌乱下垂，适合狼尾感、遮脸碎发",
        "long05": "长发05：齐肩圆润直发，侧分斜刘海，发尾内扣，适合顺直波波头、内扣中长发",
        "long06": "长发06：超蓬松长卷发，两侧大发量卷曲，适合浓密卷发、大波浪",
        "long07": "长发07：齐刘海齐肩直发，发尾平齐，适合黑长直短款、学生头、姬发感",
        "long08": "长发08：齐刘海齐肩直发，花环头饰，适合花环、花冠、直发学生头",
        "long09": "长发09：侧分披肩发，前额斜刘海，两侧发尾外扩，适合柔顺披肩发",
        "long10": "长发10：高丸子头，碎刘海，两侧短发束，适合发髻、丸子头、盘发",
        "long11": "长发11：高丸子头，厚齐刘海，后颈短发束，适合带刘海的丸子头",
        "long12": "长发12：半扎小丸子，中长侧发，碎刘海，适合半扎发、随性扎发",
        "long13": "长发13：双丸子头，额前碎发，两侧短发束，适合哪吒头、双发髻",
        "long14": "长发14：双低马尾，厚刘海，两侧短辫，适合低双马尾、学生感",
        "long15": "长发15：高双马尾，齐刘海，两侧发尾上翘，适合活泼双马尾",
        "long16": "长发16：单侧长辫，厚刘海，适合麻花辫、侧辫、编发",
        "long17": "长发17：单侧披发或侧马尾，露额，长发集中在一侧，适合侧分侧披发",
        "long18": "长发18：单侧披发或侧马尾，露额，带花朵发饰，适合侧发加发饰",
        "long19": "长发19：高马尾，侧分短刘海，后方发束下垂，适合清爽马尾",
        "long20": "长发20：中长直发，大片斜刘海遮住一只眼，适合遮眼发、厚斜刘海",
        "long21": "长发21：圆润短波波头，齐刘海，耳侧小发束，适合短直发、乖巧学生头",
        "long22": "长发22：蓬松大波浪中长发，左右外扩，适合浓密卷发、爆炸卷",
        "long23": "长发23：双丸子头，露额，两个圆发髻，适合简洁哪吒头",
        "long24": "长发24：侧分波浪短中发，一侧蓬松外翘，适合短卷发、复古波浪",
        "long25": "长发25：侧分大斜刘海短中发，一侧刘海下垂，适合偏分遮额短发",
        "long26": "长发26：厚重中长直发，碎刘海遮眼，两侧包脸，适合遮眼刘海、日系厚发",
        "short01": "短发01：厚短发，侧分斜刘海，发尾贴头，适合清爽偏分短发",
        "short02": "短发02：蓬松短发，齐碎刘海，头顶翘发，适合少年感、自然乱短发",
        "short03": "短发03：圆蓬短卷发，小卷密集，适合自然卷、卷毛短发",
        "short04": "短发04：极短侧分发，贴头短发，适合短寸、利落侧分",
        "short05": "短发05：短发带小顶髻，前额短刘海，适合小揪揪、半扎短发",
        "short06": "短发06：长斜刘海遮一只眼，侧边收短，适合遮眼短发、厚刘海",
        "short07": "短发07：蓬松侧分短发，露额，发尾微翘，适合自然厚短发",
        "short08": "短发08：短卷发，顶部卷翘，侧边收短，适合小卷、凌乱卷发",
        "short09": "短发09：厚碎刘海短发，顶部蓬松，适合凌乱短发、少年发型",
        "short10": "短发10：顺滑侧分短发，大片斜刘海，适合复古偏分、整齐短发",
        "short11": "短发11：利落短发，侧分发际，顶部微翘，适合干净短发",
        "short12": "短发12：光头或极短发，头顶小发髻，适合小辫、武士髻感",
        "short13": "短发13：贴头超短发，前额几缕横向发丝，适合板寸、超短寸头",
        "short14": "短发14：短碎发，前额小翘发，侧边短，适合清爽运动短发",
        "short15": "短发15：夸张尖刺短发，发束向上炸开，适合刺猬头、朋克",
        "short16": "短发16：大尖刺短发，多束上扬，适合张扬刺猬头、动漫感短发",
        "short17": "短发17：小卷刺短发，顶部密集短卷，适合短卷毛、卷寸",
        "short18": "短发18：竖立短刺发，发束整体向上，适合短刺猬头、硬发",
        "short19": "短发19：光头或剃光头，头顶无发，适合秃头、极简无发",
    },
    "eyes": {
        "variant01": "眼睛01：大圆眼，黑眼珠朝右，睁开自然，适合普通圆眼、默认眼神",
        "variant02": "眼睛02：大圆眼，双眼都向左看，适合斜视左看、侧目",
        "variant03": "眼睛03：大圆眼，双眼都向右看，适合斜视右看、侧目",
        "variant04": "眼睛04：半闭眼，眼皮低垂，适合困倦、冷淡、慵懒",
        "variant05": "眼睛05：半月眼，眼珠向上或侧上看，适合怀疑、无语、斜眼",
        "variant06": "眼睛06：细长小眼，左右横向，适合眯眼、冷淡、狐疑",
        "variant07": "眼睛07：细长小眼，眼珠偏侧，适合侧目、眯眼观察",
        "variant08": "眼睛08：螺旋圈圈眼，适合晕眩、混乱、惊呆",
        "variant09": "眼睛09：大小眼，一只圆眼一只眯眼，适合眨眼、俏皮、不对称表情",
        "variant10": "眼睛10：大小眼，一只圆眼一只小眯眼，适合眨眼、疑惑",
        "variant11": "眼睛11：眼珠向上看，露出下方眼白，适合上翻眼、呆滞",
        "variant12": "眼睛12：眼珠向上看，双眼上翻，适合呆萌、发愣",
        "variant13": "眼睛13：一只眯眼一只上翻眼，适合调皮、怪表情",
        "variant14": "眼睛14：细眯眼，双眼向侧边看，适合不屑、怀疑、侧目",
        "variant15": "眼睛15：下垂眼，眼皮低，适合难过、疲惫、无辜",
        "variant16": "眼睛16：半闭下垂眼，适合困、累、没精神",
        "variant17": "眼睛17：半闭方形眼，适合厌倦、无语、冷漠",
        "variant18": "眼睛18：半闭侧目眼，适合斜眼、淡漠、不耐烦",
        "variant19": "眼睛19：闭眼弯弧，适合开心笑眼、眯眼笑",
        "variant20": "眼睛20：闭眼弧线，适合平静闭眼、安静",
        "variant21": "眼睛21：单眼眨眼，适合 wink、调皮、眨一只眼",
        "variant22": "眼睛22：一眼闭一眼睁，适合眨眼、俏皮",
        "variant23": "眼睛23：星星高光大眼，适合星星眼、崇拜、兴奋、闪亮眼",
        "variant24": "眼睛24：圆眼内斜，两个眼珠靠近，适合斗鸡眼、对眼、呆萌",
        "variant25": "眼睛25：圆眼侧看，两个眼珠朝同一侧，适合侧目、斜视",
        "variant26": "眼睛26：圆眼侧看，两个眼珠朝另一侧，适合侧目、斜视",
    },
    "eyebrows": {
        "variant01": "眉毛01：粗黑下压眉，眉头靠近，适合严肃、生气、浓眉",
        "variant02": "眉毛02：粗黑上挑斜眉，适合愤怒、锐利、强势",
        "variant03": "眉毛03：短小皱眉，眉心有竖线，适合困惑、担心、皱眉",
        "variant04": "眉毛04：默认浓眉，较粗平直，适合自然浓眉、中性表情",
        "variant05": "眉毛05：短粗椭圆眉，适合卡通粗眉、呆萌",
        "variant06": "眉毛06：细弯眉，眉尾上扬，适合温和、秀气、轻松",
        "variant07": "眉毛07：一高一低八字眉，适合担心、委屈、不安",
        "variant08": "眉毛08：短粗自然眉，适合普通短眉、低调",
        "variant09": "眉毛09：弯月眉，圆弧上扬，适合柔和、友善",
        "variant10": "眉毛10：单侧细弧眉，另一侧被遮挡，适合轻微挑眉、侧分遮眉",
        "variant11": "眉毛11：细短弯眉，适合温柔、清淡、自然",
        "variant12": "眉毛12：粗弯眉，眉峰明显，适合精神、开朗",
        "variant13": "眉毛13：短直粗眉，适合平直眉、认真",
        "variant14": "眉毛14：多条短线眉，适合受伤、刮痕、皱褶感",
        "variant15": "眉毛15：短粗椭圆眉，左右分离，适合呆萌、简洁浓眉",
    },
    "mouth": {
        "variant01": "嘴巴01：张嘴微笑，露红色口腔，适合开心、开朗",
        "variant02": "嘴巴02：小弧线微笑，闭嘴，适合温和浅笑",
        "variant03": "嘴巴03：小圆张嘴，适合惊讶、发愣",
        "variant04": "嘴巴04：歪斜下撇嘴，适合不满、别扭、委屈",
        "variant05": "嘴巴05：红唇露齿大笑，适合灿烂笑、女性化红唇",
        "variant06": "嘴巴06：小红唇微笑，适合淡妆红唇、浅笑",
        "variant07": "嘴巴07：小张嘴露牙，适合惊讶、紧张",
        "variant08": "嘴巴08：红色小歪嘴，适合不悦、嫌弃、撇嘴",
        "variant09": "嘴巴09：短平线嘴，适合中性、淡定、默认",
        "variant10": "嘴巴10：嘟嘴侧撇，适合鼓嘴、亲吻、傲娇",
        "variant11": "嘴巴11：横向小牙齿，适合咬牙、紧张、尴尬",
        "variant12": "嘴巴12：吐舌头小表情，适合调皮、卖萌",
        "variant13": "嘴巴13：张嘴吐舌并流口水，适合馋、搞怪",
        "variant14": "嘴巴14：张嘴露牙下弯，适合害怕、担心、惊慌",
        "variant15": "嘴巴15：大圆张嘴，适合惊叫、震惊",
        "variant16": "嘴巴16：伸舌头，适合吐舌、调皮",
        "variant17": "嘴巴17：亲吻嘟嘴，适合亲亲、卖萌",
        "variant18": "嘴巴18：小黑圆嘴，适合惊讶、哦",
        "variant19": "嘴巴19：卷曲小胡子嘴，适合滑稽、猫嘴感、怪表情",
        "variant20": "嘴巴20：小爱心嘴，适合可爱、害羞、亲吻",
        "variant21": "嘴巴21：小爱心嘴，位置偏上，适合可爱、甜美",
        "variant22": "嘴巴22：露齿弯笑，适合咧嘴笑、友好",
        "variant23": "嘴巴23：大露齿笑，适合灿烂笑、爽朗",
        "variant24": "嘴巴24：张嘴吐舌，适合搞怪、顽皮",
        "variant25": "嘴巴25：大露齿笑，红唇边，适合开心大笑",
        "variant26": "嘴巴26：夸张张嘴大笑，露牙和舌头，适合爆笑",
        "variant27": "嘴巴27：大张嘴笑，露舌，适合兴奋、欢呼",
        "variant28": "嘴巴28：三角张嘴笑，露牙和舌头，适合可爱开心",
        "variant29": "嘴巴29：V 形小嘴，适合猫嘴、尖嘴、俏皮",
        "variant30": "嘴巴30：小三角张嘴，适合轻松开心、说话",
    },
    "hairColor": {
        "#0e0e0e": "黑发、深黑、乌黑",
        "#e5d7a3": "浅金发、米金色、浅金黄",
        "#b9a05f": "暗金发、蜂蜜金、卡其金",
        "#796a45": "灰棕发、橄榄棕、暗棕",
        "#85c2c6": "蓝绿色、青色、薄荷蓝发",
        "#6a4e35": "自然棕、深棕、咖啡色",
        "#562306": "深褐色、巧克力棕、黑棕",
        "#afafaf": "灰发、银灰、白发",
        "#3eac2c": "绿色发、草绿",
        "#dba3be": "粉色发、浅粉、玫瑰粉",
        "#592454": "紫色发、深紫、葡萄紫",
        "#ac6511": "铜棕发、焦糖色、栗色",
        "#cb6820": "橙棕发、姜黄色、暖橙",
        "#ab2a18": "红发、酒红、砖红",
    },
    "skinColor": {
        "#f2d3b1": "白皙、浅肤色、默认肤色",
        "#ecad80": "小麦色、健康肤色、浅棕肤色",
        "#9e5622": "棕色皮肤、中深肤色、古铜色",
        "#763900": "深色皮肤、黑皮、深棕肤色",
    },
    "details": {
        "none": "无脸部细节、干净脸",
        "birthmark": "右脸单颗黑痣或胎记，适合痣、泪痣、小黑点",
        "blush": "双颊大块粉色腮红，适合脸红、害羞红晕",
        "freckles": "两侧脸颊多颗小雀斑，适合雀斑、小斑点",
        "mustache": "鼻下黑色卷翘小胡子，适合八字胡、翘胡子",
    },
    "glasses": {
        "none": "不戴眼镜",
        "variant01": "黑色墨镜，深色太阳镜，适合酷感、遮眼",
        "variant02": "大圆框眼镜，透明镜片，适合圆框眼镜、书卷气",
        "variant03": "小圆框眼镜，细框，适合复古小圆眼镜",
        "variant04": "中等圆框眼镜，细黑框，适合普通近视眼镜",
        "variant05": "厚框圆眼镜，深色框，适合醒目圆框眼镜",
    },
    "earrings": {
        "none": "无耳饰",
        "variant01": "小圆环耳环，耳垂下方小吊环",
        "variant02": "白色圆形耳环或耳钉，较醒目",
        "variant03": "耳朵上多颗小耳钉，适合耳骨钉、多个耳洞",
        "variant04": "一上一下两个耳饰，组合耳钉，适合双耳洞",
        "variant05": "耳朵上方交叉小耳饰，适合耳夹、耳骨饰",
        "variant06": "单颗黑色小耳钉，低调耳饰",
    },
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
