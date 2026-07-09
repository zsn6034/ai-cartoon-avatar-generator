# AI 卡通头像生成器

一个前后端分离的头像与换装生成 MVP：上传图片或通过多轮自由对话描述外貌 / 穿搭，由后端按前端传入的 LLM 配置调用 OpenAI-compatible 模型，分别生成 DiceBear Adventurer 原生头像参数或 Messenger 风格 3D 换装资产选择。前端支持 2D SVG 头像组合渲染、3D 骨骼角色预览、手动微调和本地历史记录。

## 核心功能

- **DiceBear Adventurer SVG 头像**：前端使用基于本地 `frontend/src/avatar/adventurer.min.json` 的 Adventurer 部件组合渲染。
- **Adventurer 原生参数**：头像状态直接使用 `hair`、`eyes`、`eyebrows`、`mouth`、`hairColor`、`skinColor`、`details`、`glasses`、`earrings`
- **Messenger 3D 换装**：访问 `/3d-outfit-change`，通过上传图片或自由对话把输入映射为 `hair`、`top`、`bottom`、`shoes` 四类 3D 资产。
- **Three.js 3D 预览**：前端从 `frontend/public/messenger-avatar/` 本地加载 Messenger `.drc` 资产，使用自定义 Draco 解码、SkinnedMesh、骨骼和动画剪辑渲染角色。
- **动作预览**：3D 页面支持 `idle`、`run`、`sprint`、`air`、`afk1`、`afk2`、`afk3` 动作选择，动作只影响预览并保存到 3D 历史记录。
- **多轮自由对话**：用户可以连续补充描述。发送消息只更新本轮会话记忆，不会自动更新头像预览。
- **显式生成**：点击“生成头像”或“生成 3D 搭配”时才调用 LLM，把当前 `messages + chatMemory` 转换为完整资产参数并更新预览、编辑器和原因面板。
- **本地会话记忆**：`/api/chat/remember` 和 `/api/outfit/chat/remember` 只在服务端本地合并用户描述，不触发 LLM 调用；真正的模型调用只发生在图片分析和点击生成时。
- **前端 LLM 配置**：前端支持在弹窗里配置 provider、model、apiKey、baseUrl，并保存到浏览器本地；后端按每次请求传入的配置调用模型。
- **服务端可观测日志**：后端记录 API 请求耗时、Provider fallback、LLM request 摘要、原始响应内容和 JSON 解析结果，便于排查模型调用问题。

> Adventurer 头像素材来自 DiceBear Adventurer 风格。正式发布时请补充 DiceBear / Adventurer 的 CC BY 4.0 attribution。
> Messenger 3D 演示资产来自 `https://messenger.abeto.co/` 的公开 Web 资源，本项目当前仅做本地 demo 集成。正式发布前请确认资产授权与 attribution 要求。

## 项目结构

```text
frontend/  React + Vite + TypeScript，负责 SVG 渲染、交互和 IndexedDB draft
backend/   FastAPI + Provider adapters，负责图片/对话分析和模型调用
```

关键 3D 目录：

```text
frontend/public/messenger-avatar/  本地 Messenger 3D .drc / draco wasm / worker 资产
frontend/src/outfit3d/              Messenger Draco 解码、骨骼、材质和动画装配
frontend/src/components/outfit/     3D 换装预览、编辑器、历史和原因面板
frontend/src/pages/OutfitChangePage.tsx
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

打开 `http://localhost:5173` 使用 2D 头像生成。打开 `http://localhost:5173/3d-outfit-change` 使用 3D 换装。Vite 已配置 `/api` 代理到 `http://localhost:8000`。

## 免费 Demo 部署

推荐用 Cloudflare Pages 部署前端，用 Vercel Python Runtime 部署 FastAPI 后端。这个组合不依赖 Render 绑卡，也比 Hugging Face Spaces 更贴近普通 Web 后端部署。

### 1. 部署后端到 Vercel

`backend/api/index.py` 导出 FastAPI app，`backend/vercel.json` 会把 `/api/*` 请求明确路由到这个 Python 函数，避免 Vercel 部署后 `/api/health` 变成平台 404。依赖通过 `backend/requirements.txt` 安装。

在 Vercel 新建 Project，连接本仓库后配置：

- Root Directory: `backend`
- Framework Preset: `Other`
- Build Command: 留空
- Output Directory: 留空
- Install Command: `pip install -r requirements.txt`

Vercel 环境变量：

```env
DEFAULT_PROVIDER=qwen
FRONTEND_ORIGIN=https://your-vercel-web.vercel.app
FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app
QWEN_API_KEY=
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-plus
DOUBAO_API_KEY=
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-1-5-vision-pro-32k-250115
```

如果还没拿到前端域名，可以先填 `http://localhost:5173`，等前端发布后再改成正式域名。多个来源可以用逗号分隔。`FRONTEND_ORIGIN_REGEX` 默认放行 `.vercel.app` 域名，demo 阶段可保留；正式发布时建议改成空值，并只保留精确的 `FRONTEND_ORIGIN`。

部署成功后，后端地址通常类似：

```text
https://your-vercel-api.vercel.app
```

检查：

```text
https://your-vercel-api.vercel.app/api/health
```

### 2. 部署前端到 Cloudflare Pages

Cloudflare Pages 连接同一个仓库，配置：

- Root directory: `frontend`
- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Build output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-vercel-api.vercel.app`

`VITE_API_BASE_URL` 填 Vercel 后端地址，不要以 `/api` 结尾。

### 3. 发布后检查

1. 打开 `https://your-vercel-api.vercel.app/api/health`，应返回 `{"status":"ok"}`。
2. 打开 Cloudflare Pages 前端域名。
3. 在前端 LLM 配置里填 provider、model、baseUrl 和 API Key。
4. 测试自由对话和“生成头像”。如果浏览器报 CORS，检查 Vercel 的 `FRONTEND_ORIGIN` 是否等于前端完整 origin，例如 `https://your-site.pages.dev`。

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
- `POST /api/outfit/analyze/image`
  - FormData 输入 `llm_config` JSON 字符串和 `image`，上传图片后直接调用模型，返回完整 3D 换装 `features`。
- `POST /api/outfit/chat/remember`
  - 输入 `llm_config`、`messages`、`current_memory`。
  - 只做本地 3D 换装会话记忆合并，不调用 LLM。
- `POST /api/outfit/chat/generate`
  - 输入 `llm_config`、`messages`、`chat_memory`。
  - 调用模型生成完整 3D 换装 `features`。

图片上传限制为 5MB。后端只在内存中读取图片，不落盘。

## 对话生成流程

1. 用户在“自由对话”里多次描述外貌或风格。
2. 每次发送消息调用 `/api/chat/remember`，服务端把用户描述去重合并到 `chatMemory.summary` 和 `chatMemory.notes`。
3. 头像预览保持不变，避免每轮对话都触发模型生成。
4. 用户点击“生成头像”后调用 `/api/chat/generate`。
5. 后端根据会话记忆和中文语义映射提示生成 Adventurer 原生参数。
6. 前端更新 SVG 预览、特征编辑器和原因面板。

## 3D 换装流程

1. 用户进入 `/3d-outfit-change`，选择上传图片或自由对话。
2. 图片模式调用 `/api/outfit/analyze/image`，对话模式先通过 `/api/outfit/chat/remember` 累积描述，再点击生成调用 `/api/outfit/chat/generate`。
3. 后端把输入映射为 Messenger 3D 资产字段：`hair`、`top`、`bottom`、`shoes`。
4. 前端从 `frontend/public/messenger-avatar/geometries/avatar/accessories/` 加载 `base.drc` 与选中的服装部件。
5. 前端从 `frontend/public/messenger-avatar/geometries/avatar/animations/` 加载 `avatar-bones.drc` 和动作 `.drc`，用 Three.js 创建 `SkinnedMesh` 和 `AnimationMixer`。
6. 右侧资产调整只替换准备完成的新模型，并保留旧模型旋转角度和动画时间，避免切换时闪白或回正。
7. 3D 历史记录与 2D 头像历史分开保存，记录当前资产选择、AI 原始选择、动作、输入来源和映射原因。

## 本地持久化

前端使用 `localStorage` 保存 LLM 配置：

- `provider`
- `model`
- `apiKey`
- `baseUrl`

前端使用 IndexedDB 保存 `schemaVersion: 3` 生成记录：

- `messages`
- `chatMemory`
- `generatedSelection`
- `currentSelection`
- `analysis`
- `provider`

2D 记录保存到 `generation-records`，3D 换装记录保存到 `outfit-generation-records`，二者互不覆盖。3D 记录额外保存：

- `action`
- `features.hair`
- `features.top`
- `features.bottom`
- `features.shoes`

旧记录会继续兼容：保留聊天记录和 provider 字符串，旧语义特征会丢弃并回到默认 Adventurer 配置。

## 验证命令

```bash
cd frontend
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build

cd ..
PYTHONPYCACHEPREFIX=/private/tmp/pycache-codex python3 -m py_compile backend/app/schemas/face.py backend/app/schemas/outfit.py backend/app/providers/base.py backend/app/services/provider_factory.py backend/app/main.py
```

## 当前边界

当前版本不做真人换脸、人脸关键点检测、服务端持久化、账号和自动相似度评分。2D 头像由 AI 映射为 Adventurer 部件参数，3D 换装由 AI 映射为有限的 Messenger 资产组合；两者都支持用户在前端手动修正最终选择。3D 换装当前是资产匹配与预览，不是物理布料仿真或照片级真实试衣。
