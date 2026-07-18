# AI 卡通头像生成器：代理协作指南

## 项目概览

这是一个前后端分离的 AI 头像与 3D 换装应用。

- `frontend/`：React 19、TypeScript、Vite 和 Three.js。负责用户交互、2D SVG 头像、3D 角色预览，以及浏览器本地保存的配置和历史记录。
- `backend/`：FastAPI 与 Provider adapters。负责接收图片/对话、调用 OpenAI-compatible 模型，并将结果校验为前端可用的特征选择。

产品有两条独立工作流：

1. 2D 头像：将输入映射到 DiceBear Adventurer 的发型、五官、颜色与配饰参数。
2. 3D 换装：将输入映射到 Messenger 风格资产的 `hair`、`top`、`bottom`、`shoes` 组合，并由 Three.js 渲染。

这不是换脸、真人身份识别或照片级虚拟试衣。不要实现或声称真实人物相似度、敏感身份推断或精确服装复刻。

## 架构与数据约定

- 前端从用户在浏览器保存的 LLM 配置中读取 `provider`、`model`、`apiKey` 和 `baseUrl`，每次请求传给后端；API Key 不应提交到仓库，也不应由后端环境变量注入前端。
- 对话发送阶段仅调用 `*/chat/remember` 合并本地会话记忆；只有用户显式触发“生成头像”或“生成 3D 搭配”时，才调用模型生成最终特征。
- 后端的 Pydantic schema 是 API 值域的权威来源。修改可选头像或换装资产时，必须同步更新后端 schema、前端类型、注册表/映射和编辑 UI，确保模型输出、API 校验与渲染器使用同一组值。
- 2D 头像素材及其映射位于 `frontend/src/avatar/`、`frontend/src/assetsRegistry/`；3D 换装的资产映射位于 `frontend/src/outfitRegistry/`，本地 Draco 资源位于 `frontend/public/messenger-avatar/`。
- 生成历史仅保存在浏览器：2D 与 3D 记录使用不同的 IndexedDB store。修改记录结构时需保持旧记录可安全降级到默认选择。
- 图片限制为 5MB，并且只在后端内存中处理，不落盘。

## 开发约定

- 维持前后端分离：页面、组件、API client、类型、资产映射和 IndexedDB 逻辑各放在现有对应目录，不把后端调用直接散落进展示组件。
- 新增模型供应商时，在 `backend/app/providers/` 实现并通过 `provider_factory.py` 注册；保持 OpenAI-compatible 请求/响应与现有 fallback 行为一致。
- 后端 API 保持 `/api` 前缀。前端开发服务器已将 `/api` 代理到 `http://localhost:8000`。
- 修改模型提示词时，继续要求严格 JSON、限定允许值，并避免敏感身份推断。日志不得输出完整 API Key 或原始图片 data URL。
- 不要无故替换 `frontend/public/messenger-avatar/` 下的 Draco、worker 或 wasm 资产。它们用于本地 demo，发布前仍需确认授权与 attribution。
- 不提交 `.env`、依赖目录、构建产物或本地缓存；以 `backend/.env.example` 作为环境变量模板。

## 本地运行与验证

启动后端：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

启动前端：

```bash
pnpm install
pnpm --filter ai-cartoon-avatar-generator dev
```

前端位于 `http://localhost:5173`，后端健康检查为 `http://localhost:8000/api/health`。改动完成后，至少运行与改动相关的检查；全量基础检查为：

```bash
cd frontend
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build

cd ..
PYTHONPYCACHEPREFIX=/private/tmp/pycache-codex python3 -m py_compile backend/app/schemas/face.py backend/app/schemas/outfit.py backend/app/providers/base.py backend/app/services/provider_factory.py backend/app/main.py
```

## 部署边界

- 生产环境使用一个 Vercel Project 一体化部署前端与 FastAPI：站点和 `/api/*` 共享同一域名，不要将它们改回两个独立项目或部署到 Cloudflare Pages。
- 前端在一体化部署中使用相对 `/api/*` 请求，保持 `VITE_API_BASE_URL` 未设置；该变量只用于前后端分离的调试场景。
- 根目录 `vercel.json` 通过 Vercel Services 编排部署：`frontend` service 负责 Vite 构建，`backend` service 以 `backend/api/index.py` 为 FastAPI 入口。调整服务、rewrite、函数配置或 `backend/requirements.txt` 时，须同时确认同一项目的前端构建仍可访问 API。
- 页面与 API 同源时通常无需生产 CORS 配置；若增加额外来源，使用精确的 `FRONTEND_ORIGIN`，并保持 `FRONTEND_ORIGIN_REGEX` 为空或最小化。

## 交付前检查

- API、Pydantic schema、前端类型及资产注册表的字段和值域保持一致。
- 2D 与 3D 工作流、各自的历史记录和手动编辑能力没有互相覆盖。
- 运行相关验证命令，并说明未运行的检查及原因。
- 若改动用户可见行为、环境变量或部署方式，同步更新 `README.md`。
