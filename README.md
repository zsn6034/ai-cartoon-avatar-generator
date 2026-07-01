# AI 卡通头像生成器

一个前后端分离的 MVP：上传图片或通过自由对话描述外貌，由后端调用 Qwen / 豆包抽取标准脸部特征，前端使用规则映射和 canvas 绘制 2D 卡通头像，并展示 AI 推荐、当前选择和映射原因。

## 结构

```text
frontend/  React + Vite + TypeScript
backend/   FastAPI + Provider adapters
```

## 后端启动

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

没有配置 API Key 时，后端会返回本地 fallback 数据，前端仍可完整演示流程。

## 前端启动

```bash
pnpm install
pnpm --filter ai-cartoon-avatar-generator dev
```

打开 `http://localhost:5173`。Vite 已配置 `/api` 代理到 `http://localhost:8000`。

## API

- `GET /api/health`
- `GET /api/providers`
- `POST /api/analyze/image`
- `POST /api/analyze/chat`

图片上传限制为 5MB。后端只在内存中读取图片，不落盘。

## MVP 边界

当前版本不做真人换脸、人脸关键点检测、服务端存储、账号、历史列表、3D 和自动相似度评分。AI 负责特征判断，前端规则负责资产映射，用户可手动修正最终选择。
