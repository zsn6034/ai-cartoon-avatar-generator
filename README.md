# AI 卡通头像生成器

一个前后端分离的头像生成 MVP：上传图片或通过多轮自由对话描述外貌，由后端按前端传入的 LLM 配置调用 OpenAI-compatible 模型生成 DiceBear Adventurer 原生头像参数，前端使用本地 Adventurer JSON 资产组合 SVG 头像，并支持手动微调。

## 核心功能

- **DiceBear Adventurer SVG 头像**：前端使用基于本地 `frontend/src/avatar/adventurer.min.json` 的 Adventurer 部件组合渲染。
- **Adventurer 原生参数**：头像状态直接使用 `hair`、`eyes`、`eyebrows`、`mouth`、`hairColor`、`skinColor`、`details`、`glasses`、`earrings`
- **多轮自由对话**：用户可以连续补充描述。发送消息只更新本轮会话记忆，不会自动更新头像预览。
- **显式生成头像**：点击“生成头像”时才调用 LLM，把当前 `messages + chatMemory` 转换为完整 Adventurer 参数并更新预览、编辑器和原因面板。
- **本地会话记忆**：`/api/chat/remember` 只在服务端本地合并用户描述，不触发 LLM 调用；真正的模型调用只发生在图片分析和点击生成头像时。
- **前端 LLM 配置**：前端支持在弹窗里配置 provider、model、apiKey、baseUrl，并保存到浏览器本地；后端按每次请求传入的配置调用模型。
- **服务端可观测日志**：后端记录 API 请求耗时、Provider fallback、LLM request 摘要、原始响应内容和 JSON 解析结果，便于排查模型调用问题。

> Adventurer 头像素材来自 DiceBear Adventurer 风格。正式发布时请补充 DiceBear / Adventurer 的 CC BY 4.0 attribution。

## 项目结构

```text
frontend/  React + Vite + TypeScript，负责 SVG 渲染、交互和 IndexedDB draft
backend/   FastAPI + Provider adapters，负责图片/对话分析和模型调用
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

`.env` 中可以配置可选的 provider 预设默认值：

```env
QWEN_API_KEY=
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-plus

DOUBAO_API_KEY=
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-1-5-vision-pro-32k-250115

DEFAULT_PROVIDER=doubao
FRONTEND_ORIGIN=http://localhost:5173
```

实际模型调用以浏览器里保存的 LLM 配置为准。API Key 不会从 `.env` 自动注入前端；未配置前端 API Key 时，前端会提示先完成 LLM 配置。模型请求失败时，后端会返回本地 fallback Adventurer 参数，前端仍可完整演示流程。

## 前端启动

```bash
pnpm install
pnpm --filter ai-cartoon-avatar-generator dev
```

打开 `http://localhost:5173`。Vite 已配置 `/api` 代理到 `http://localhost:8000`。

## API

- `GET /api/health`
- `GET /api/providers`
  - 返回前端配置面板可用的 provider 预设、模型名、baseUrl 和 `default_provider`。
- `POST /api/analyze/image`
  - FormData 输入 `llm_config` JSON 字符串和 `image`，上传图片后直接调用模型，返回完整 Adventurer `features`。
- `POST /api/chat/remember`
  - 输入 `llm_config`、`messages`、`current_memory`。
  - 只做本地会话记忆合并，不调用 LLM。
- `POST /api/chat/generate`
  - 输入 `llm_config`、`messages`、`chat_memory`。
  - 调用模型生成完整 Adventurer `features`。

图片上传限制为 5MB。后端只在内存中读取图片，不落盘。

## 对话生成流程

1. 用户在“自由对话”里多次描述外貌或风格。
2. 每次发送消息调用 `/api/chat/remember`，服务端把用户描述去重合并到 `chatMemory.summary` 和 `chatMemory.notes`。
3. 头像预览保持不变，避免每轮对话都触发模型生成。
4. 用户点击“生成头像”后调用 `/api/chat/generate`。
5. 后端根据会话记忆和中文语义映射提示生成 Adventurer 原生参数。
6. 前端更新 SVG 预览、特征编辑器和原因面板。

## 本地持久化

前端使用 `localStorage` 保存 LLM 配置：

- `provider`
- `model`
- `apiKey`
- `baseUrl`

前端使用 IndexedDB 保存 `schemaVersion: 2` 生成记录：

- `messages`
- `chatMemory`
- `generatedSelection`
- `currentSelection`
- `analysis`
- `provider`

旧记录会继续兼容：保留聊天记录和 provider 字符串，旧语义特征会丢弃并回到默认 Adventurer 配置。

## 验证命令

```bash
cd frontend
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build

cd ..
PYTHONPYCACHEPREFIX=/private/tmp/pycache-codex python3 -m py_compile backend/app/schemas/face.py backend/app/providers/base.py backend/app/services/provider_factory.py backend/app/main.py
```

## 当前边界

当前版本不做真人换脸、人脸关键点检测、服务端持久化、账号、历史列表、3D 和自动相似度评分。AI 负责把输入描述映射为 Adventurer 部件参数，用户可以在前端手动修正最终选择。
