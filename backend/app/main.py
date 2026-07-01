from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.schemas.face import AnalysisResponse, ChatAnalyzeRequest
from app.services.image_analysis import image_to_data_url
from app.services.provider_factory import get_provider, list_providers

settings = get_settings()

app = FastAPI(title="AI Cartoon Avatar Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/providers")
async def providers():
    return list_providers()


@app.post("/api/analyze/image", response_model=AnalysisResponse)
async def analyze_image(provider: str = Form(...), image: UploadFile = File(...)):
    selected_provider = get_provider(provider)
    data_url = await image_to_data_url(image)
    return await selected_provider.analyze_image(data_url)


@app.post("/api/analyze/chat", response_model=AnalysisResponse)
async def analyze_chat(request: ChatAnalyzeRequest):
    selected_provider = get_provider(request.provider)
    messages = [message.model_dump() for message in request.messages]
    return await selected_provider.analyze_chat(
        messages=messages,
        current_features=request.current_features.model_dump(exclude_none=True),
        round_index=request.round_index,
    )
