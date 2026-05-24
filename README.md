# 电子样册系统

一个多用户在线电子样册管理平台，用户可以上传 PDF 文件自动生成可在线翻阅的电子样册，每个用户拥有独立的书橱展示页面。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 14 | App Router，支持 SSR/SSG，standalone 输出模式 |
| 语言 | TypeScript | 全栈类型安全 |
| UI | Tailwind CSS 3 | 原子化 CSS，暗色主题 |
| 数据库 | SQLite + Prisma 5 | 轻量级本地数据库，Prisma ORM 管理 |
| PDF渲染 | pdf.js 3.11 | 客户端 Canvas 渲染 PDF 页面 |
| 认证 | Cookie + bcryptjs | Base64 Token 存储于 HttpOnly Cookie，密码 bcrypt 加密 |
| 运行时 | Node.js | 本地文件系统存储上传的 PDF |

## 功能概览

### 用户系统
- 注册：设置用户名、密码、书橱标识（slug）
- 登录/登出：Cookie 认证，24小时有效期
- 数据隔离：每个用户只能管理自己的书籍和分类

### 管理后台（/dashboard）
- 上传 PDF 样册，支持设置标题和分类
- 查看已上传的样册列表（页数、分类、日期）
- 删除样册
- 复制书橱公开链接

### 书橱展示（/bookcase/:slug）
- 每个用户拥有独立的公开书橱页面
- 按分类展示书籍封面
- 支持搜索
- 访客无需登录即可浏览

### PDF 在线阅读（/book/:id）
- Canvas 渲染，逐页翻阅
- 缩放控制（50% ~ 300%）
- 键盘方向键翻页
- 点击屏幕左/右区域翻页
- 加载动画

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页（落地页）
│   ├── register/page.tsx     # 注册页
│   ├── admin/login/page.tsx  # 登录页
│   ├── dashboard/page.tsx    # 管理后台
│   ├── bookcase/[slug]/      # 书橱公开页
│   ├── book/[id]/            # PDF阅读页
│   └── api/
│       ├── auth/             # 认证接口（register/login/logout/check）
│       ├── books/            # 书籍CRUD + 文件上传
│       └── categories/       # 分类接口
├── components/
│   ├── PDFViewer.tsx         # PDF翻页阅读器
│   ├── BookShelf.tsx         # 书架网格布局
│   ├── BookCover.tsx         # 书籍封面卡片
│   ├── SearchBar.tsx         # 搜索栏
│   └── Header.tsx            # 页头导航
├── lib/
│   ├── db.ts                 # Prisma 客户端单例
│   └── auth.ts               # 认证工具函数
prisma/
├── schema.prisma             # 数据模型定义
├── seed.js                   # 种子数据脚本
└── dev.db                    # SQLite 数据库文件
```

## 数据模型

- **User**：用户（username, password, slug, role）
- **Book**：书籍（title, pdfUrl, pages, coverUrl, 关联 User 和 Category）
- **Category**：分类（name, 关联 User），同一用户下分类名唯一

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

默认配置使用本地 SQLite，无需额外数据库服务。

### 3. 初始化数据库

```bash
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 使用流程

1. 访问首页，点击「免费注册」
2. 填写用户名、密码、书橱标识（如 `my-company`）
3. 进入管理后台，上传 PDF 文件
4. 将书橱链接 `/bookcase/my-company` 分享给客户
5. 客户打开链接即可在线翻阅样册

## 构建部署

```bash
npm run build
npm run start
```

项目配置了 `output: 'standalone'`，构建产物可独立部署，无需完整 node_modules。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run db:push` | 同步数据库结构 |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:studio` | 打开 Prisma Studio 可视化管理数据库 |
