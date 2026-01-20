# SimpleTextEditor

一个基于 Docker 部署的简约多人实时协作 Markdown 编辑器，功能对标 Typora。
最初只是想要一个“随开随写、多人可协同、部署不费劲”的笔记工具，如今它已经拥有图床、导入导出、协作光标、所见即所得等完整体验。


<div align="center">
<img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"> <img src="https://img.shields.io/badge/node-%3E%3D20-green.svg" alt="Node"> <img src="https://img.shields.io/badge/docker-ready-blue.svg" alt="Docker">
</div>

## ✨ 功能特性

### Markdown 支持
- **完整 GFM 支持**: 表格、任务列表、自动链接、脚注等
- **数学公式**: KaTeX 渲染，支持行内和块级公式
- **图表**: Mermaid 流程图、时序图、甘特图等
- **代码高亮**: 支持 180+ 语言
- **扩展语法**: 上标、下标、高亮标记、缩写

### 编辑功能
- **多模式编辑**: 源码模式、预览模式、分屏模式、所见即所得模式
- **丰富工具栏**: 格式化、插入、颜色选择
- **快捷键支持**: 常用操作一键完成
- **自动保存**: 可配置延迟的自动保存，防止丢失

### 实时协作
- **多人编辑**: 基于 Yjs CRDT 算法，自动合并冲突
- **光标同步**: 显示其他用户的光标位置
- **在线状态**: 实时显示协作者列表

### 其他
- **主题切换**: 浅色/深色/跟随系统
- **导入导出**: Markdown、HTML、PDF
- **图片上传**: GitHub 图床集成
- **Docker 部署**: 一键启动

## 🧭 项目故事（浓缩版）

- **起步**：`1d7f9c4`~`32f86f4` —— 从基础编辑器到完整工具栏、GFM、主题切换，奠定产品雏形。
- **协作与图床**：`dd66f82`、`0922899`、`a80e5dc` —— 接入 GitHub 图床与 Yjs 实时协作，开始具备“多人+云端资源”的能力。
- **生产化**：`382da4d`、`cdea889`、`22d8470` —— 迁移到 pnpm、改用 MySQL、完善 Docker 配置。
- **高级体验**：`171fb84`、`7bc4a4d`、`af0a73c` —— 侧边栏、所见即所得、文档管理与导入导出（Pandoc / wkhtmltopdf）。
- **易用与安全**：`6a18e13`、`3337d22`、`bd0a2c5`、`bf3fb8e` —— 加入访问密码门禁（可空值跳过），修复 API/表单细节，并将密码注入 Compose 环境，部署更稳。

## 🚀 快速开始

### 使用 Docker Compose（推荐）

1. 克隆项目
```bash
git clone https://github.com/Gentle-Lijie/SimpleTextEditor.git
cd SimpleTextEditor
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，至少填入访问密码（PASSWORD）和 GitHub Token（用于图床）
```

3. 启动服务
```bash
# 生产环境
docker-compose up -d

# 开发环境（支持热重载）
docker-compose -f docker-compose.dev.yml up
```

4. 访问应用
- 生产环境: http://localhost:3000
- 开发环境: http://localhost:5173

### 本地开发

```bash
# 安装依赖
cd frontend && pnpm install
cd ../backend && pnpm install

# 启动后端
cd backend && pnpm dev

# 启动前端（新终端）
cd frontend && pnpm dev
```

## 📁 项目结构

```
SimpleTextEditor/
├── frontend/                # 前端 Vue 3 应用
│   ├── src/
│   │   ├── components/      # Vue 组件
│   │   │   ├── Editor/      # 编辑器组件
│   │   │   ├── Toolbar/     # 工具栏组件
│   │   │   ├── Sidebar/     # 侧边栏组件
│   │   │   └── Collaboration/ # 协作组件
│   │   ├── composables/     # 组合式函数
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── utils/           # 工具函数
│   │   └── styles/          # 样式文件
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                 # 后端 Express 应用
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 服务层
│   │   └── database/        # 数据库
│   └── Dockerfile
├── docker-compose.yml       # 生产环境配置
├── docker-compose.dev.yml   # 开发环境配置
└── .env.example             # 环境变量模板
```

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | development |
| `PORT` | 后端端口 | 3001 |
| `DB_HOST` | MySQL 主机地址 | localhost |
| `DB_PORT` | MySQL 端口 | 3306 |
| `DB_USER` | MySQL 用户名 | root |
| `DB_PASSWORD` | MySQL 密码 | - |
| `DB_NAME` | MySQL 数据库名 | simpletexteditor |
| `GITHUB_TOKEN` | GitHub Personal Access Token | - |
| `GITHUB_OWNER` | GitHub 用户名 | Gentle-Lijie |
| `GITHUB_REPO` | GitHub 仓库名 | SimpleTextEditor |
| `GITHUB_BRANCH` | 图床分支 | images |
| `PASSWORD` | 访问密码（进入页面必填） | - |
| `VITE_API_URL` | 前端 API 地址 | http://localhost:3001 |
| `VITE_WS_URL` | WebSocket 地址 | ws://localhost:3001 |
| `VITE_AUTO_SAVE_DELAY` | 自动保存延迟(毫秒) | 3000 |

## 📝 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B` | 粗体 |
| `Ctrl+I` | 斜体 |
| `Ctrl+U` | 下划线 |
| `Ctrl+K` | 插入链接 |
| `Ctrl+S` | 保存 |
| `Ctrl+/` | 切换编辑模式 |
| `Ctrl+\` | 切换侧边栏 |
| `Tab` | 增加缩进 |
| `Shift+Tab` | 减少缩进 |

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Pinia
- markdown-it + 插件
- KaTeX
- Mermaid
- highlight.js
- Yjs + y-websocket

### 后端
- Node.js 20
- Express
- WebSocket (ws)
- MySQL (mysql2)
- y-websocket

### 部署
- Docker
- Docker Compose
- Nginx

## 📚 主要功能清单（复习版）

- Markdown 完整 GFM 与扩展语法（表格、脚注、任务列表、上下标、高亮等）
- 数学公式 KaTeX / 图表 Mermaid
- 代码高亮（180+ 语言）
- 多模式编辑：源码 / 预览 / 分屏 / 所见即所得
- 所见即所得下的图片缩放、选区工具栏等增强
- 丰富工具栏与快捷键，自动保存
- 实时协作：Yjs + y-websocket，光标/选区同步、在线人数显示
- 文档导入导出：Markdown / HTML / PDF（wkhtmltopdf），支持粘贴图片自动上传 GitHub 图床
- 主题：浅色/深色/跟随系统
- Docker 一键部署，前后端分离，可通过环境变量配置 API/WS/密码

## 🧰 部署与配置补充

- **密码门禁**：`.env` 中 `PASSWORD` 留空则不启用，填写则前端会在进入主界面前校验；Docker Compose 已将 `PASSWORD` 传递给 backend。
- **API/WS 地址**：通过 `VITE_API_URL`、`VITE_WS_URL` 定义；生产镜像默认可通过构建参数或环境变量覆盖。
- **图床**：需提供 `GITHUB_TOKEN`、`GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH`。

## ✍️ 写在最后

这个项目更像一段“从个人痛点到分享给朋友”的小旅程：从最初想要摆脱笨重编辑器的念头，到加上协作、图床、导入导出，再到补齐安全和部署体验。希望你也能在用它写作或协同的过程中，找到一点属于自己的流畅与自在。

## 📄 许可证

MIT License

## 🙏 致谢

- [Typora](https://typora.io/) - 设计灵感
- [markdown-it](https://github.com/markdown-it/markdown-it) - Markdown 解析
- [Yjs](https://github.com/yjs/yjs) - 实时协作
- [KaTeX](https://katex.org/) - 数学公式
- [Mermaid](https://mermaid.js.org/) - 图表渲染
