# SimpleTextEditor

一个基于 Docker 部署的简约多人实时协作 Markdown 编辑器，功能对标 Typora。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## ✨ 功能特性

### Markdown 支持
- **完整 GFM 支持**: 表格、任务列表、自动链接、脚注等
- **数学公式**: KaTeX 渲染，支持行内和块级公式
- **图表**: Mermaid 流程图、时序图、甘特图等
- **代码高亮**: 支持 180+ 语言
- **扩展语法**: 上标、下标、高亮标记、缩写

### 编辑功能
- **多模式编辑**: 源码模式、预览模式、分屏模式
- **丰富工具栏**: 格式化、插入、颜色选择
- **快捷键支持**: 常用操作一键完成
- **自动保存**: 定时保存，防止丢失

### 实时协作
- **多人编辑**: 基于 Yjs CRDT 算法，自动合并冲突
- **光标同步**: 显示其他用户的光标位置
- **在线状态**: 实时显示协作者列表

### 其他
- **主题切换**: 浅色/深色/跟随系统
- **导入导出**: Markdown、HTML、PDF
- **图片上传**: GitHub 图床集成
- **Docker 部署**: 一键启动

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
# 编辑 .env 文件，填入 GitHub Token（用于图床）
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
cd frontend && npm install
cd ../backend && npm install

# 启动后端
cd backend && npm run dev

# 启动前端（新终端）
cd frontend && npm run dev
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
| `DATABASE_PATH` | SQLite 数据库路径 | ./data/sqlite.db |
| `GITHUB_TOKEN` | GitHub Personal Access Token | - |
| `GITHUB_OWNER` | GitHub 用户名 | Gentle-Lijie |
| `GITHUB_REPO` | GitHub 仓库名 | SimpleTextEditor |
| `GITHUB_BRANCH` | 图床分支 | images |
| `VITE_API_URL` | 前端 API 地址 | http://localhost:3001 |
| `VITE_WS_URL` | WebSocket 地址 | ws://localhost:3001 |

## 📝 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B` | 粗体 |
| `Ctrl+I` | 斜体 |
| `Ctrl+U` | 下划线 |
| `Ctrl+K` | 插入链接 |
| `Ctrl+S` | 保存 |
| `Ctrl+/` | 切换编辑模式 |
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
- Socket.io
- better-sqlite3
- y-websocket

### 部署
- Docker
- Docker Compose
- Nginx

## 📄 许可证

MIT License

## 🙏 致谢

- [Typora](https://typora.io/) - 设计灵感
- [markdown-it](https://github.com/markdown-it/markdown-it) - Markdown 解析
- [Yjs](https://github.com/yjs/yjs) - 实时协作
- [KaTeX](https://katex.org/) - 数学公式
- [Mermaid](https://mermaid.js.org/) - 图表渲染
