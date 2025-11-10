---
name: HTML Starter
slug: html-starter-with-analytics
description: HTML5 template with analytics and advanced routing configuration.
deployUrl: https://vercel.com/new/clone?repository-url=https://github.com/vercel/examples/tree/main/solutions/html&project-name=html
relatedTemplates:
  - nextjs-boilerplate
---

# 学生信息管理系统（Vercel + Neon）

基于 HTML/CSS/JavaScript 的前端，结合 Vercel Serverless Functions 直连 Neon 数据库（PostgreSQL），实现登录/注册与学生信息的增删改查。

## 功能
- 登录注册：支持学生注册与登录，管理员登录
- 学生信息管理：管理员增删改查学生信息；学生可查看并修改本人信息
- 安全：密码使用 bcrypt 加密；JWT（HttpOnly Cookie）会话
- 中文：全站 UTF-8，正确处理中文数据
- 部署：Vercel 一键部署；Neon 数据库

## 环境变量（Vercel 项目设置 → Environment Variables）
- `DATABASE_URL`：Neon 提供的连接字符串（例如 postgres://...）
- `JWT_SECRET`：JWT 签名密钥（自行设置一个足够随机的字符串）

## 首次初始化
1. 部署后访问站点首页
2. 在“登录”页点击“初始化数据库”按钮（调用 `/api/init`）
   - 将创建 `admins` 与 `students` 表
   - 预置默认管理员账号：`admin / admin`

## API 概览
- 初始化：`POST /api/init`
- 管理员登录：`POST /api/auth/admin/login`
- 学生注册：`POST /api/auth/student/register`
- 学生登录：`POST /api/auth/student/login`
- 学生列表/新增（管理员）：`GET|POST /api/students`
- 学生详情/更新/删除：`GET|PUT|DELETE /api/students/[id]`
- 学生本人信息：`GET /api/students/me`

所有 API 返回 JSON，中文信息，HttpOnly Cookie 自动维持会话。

## 开发
```bash
# 安装依赖
npm install

# 开发建议使用 Vercel 本地开发
npx vercel dev
```

## 注意
- 若缺少 `JWT_SECRET` 仍可本地运行，但强烈建议在生产环境设置该变量
- 默认管理员仅用于初始登陆，建议上线后修改密码并妥善保管

