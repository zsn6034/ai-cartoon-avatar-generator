import json
from typing import Any, Dict, List


LOG_TEXT_LIMIT = 12000


def truncate(value: Any, limit: int = LOG_TEXT_LIMIT) -> str:
    text = str(value)
    if len(text) <= limit:
        return text
    return f"{text[:limit]}...<truncated {len(text) - limit} chars>"


def safe_json(value: Any, limit: int = LOG_TEXT_LIMIT) -> str:
    try:
        text = json.dumps(value, ensure_ascii=False, default=str)
    except TypeError:
        text = str(value)
    return truncate(text, limit)


def summarize_content(content: Any) -> Any:
    if isinstance(content, str):
        if content.startswith("data:"):
            return f"<data_url len={len(content)}>"
        return truncate(content, 1200)

    if isinstance(content, list):
        summarized = []
        for item in content:
            if not isinstance(item, dict):
                summarized.append(truncate(item, 400))
                continue
            cloned = dict(item)
            if isinstance(cloned.get("image_url"), dict):
                url = str(cloned["image_url"].get("url") or "")
                cloned["image_url"] = {"url": f"<image_data_url len={len(url)}>"}
            summarized.append(cloned)
        return summarized

    if isinstance(content, dict):
        return {key: summarize_content(value) for key, value in content.items()}

    return content


def summarize_messages(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        {"role": item.get("role"), "content": summarize_content(item.get("content"))}
        for item in messages
    ]
