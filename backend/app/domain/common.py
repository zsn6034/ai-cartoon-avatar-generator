from typing import Any, Dict, List, Optional

from app.schemas.face import FeatureReason


def normalize_reasons(raw_reasons: Any, features: Dict[str, str], fallback_reason: str) -> List[FeatureReason]:
    reasons: List[FeatureReason] = []
    if isinstance(raw_reasons, list):
        for item in raw_reasons:
            if isinstance(item, dict) and item.get("feature") and item.get("value"):
                reasons.append(
                    FeatureReason(
                        feature=str(item["feature"]),
                        value=str(item["value"]),
                        reason=str(item.get("reason") or fallback_reason),
                    )
                )

    if reasons:
        return reasons

    return [FeatureReason(feature=key, value=str(value), reason=fallback_reason) for key, value in features.items()]


def recent_user_notes(messages: Optional[List[Dict[str, str]]]) -> List[str]:
    notes: List[str] = []
    for item in messages or []:
        if item.get("role") != "user":
            continue
        text = " ".join(str(item.get("content") or "").split())
        if text:
            notes.append(text[:160])
    return notes[-6:]
