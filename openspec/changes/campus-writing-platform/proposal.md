# Proposal

## Why

校园里有许多想写作却找不到合适发布渠道的学生：社交平台的信息流太快，文章很快被淹没；校内渠道又往往只面向特定组织。这个项目提供一个面向校园的多作者写作平台，让任何学生都能注册、写作、发布，并由管理员维护内容质量——同时作为一份完整的全栈练手作品。

## What Changes

- 新增一个面向校园的多作者博客平台（Web 应用），任何人都可以注册成为作者。
- 新增账号体系：注册、登录、个人资料与角色（读者 / 作者 / 管理员）。
- 新增写作与发布流程：Markdown 写作、草稿、提交审核、发布 / 驳回的状态流转。
- 新增公开阅读体验：首页文章流、文章详情、作者主页、标签浏览与站内搜索。
- 新增管理员审核后台：待审队列、通过 / 驳回、用户管理（封禁）。
- 提供内置评论区：注册用户可在已发布文章下发表评论，评论数据与权限由 Supabase 管理。

## Capabilities

### New Capabilities

- `user-accounts`: 账号注册、登录、退出、个人资料与角色权限。
- `article-publishing`: 文章写作、草稿、提交审核与发布状态流转，包括封面图片。
- `content-discovery`: 公开的文章流、文章详情、作者主页、标签与搜索。
- `content-moderation`: 管理员审核队列、文章通过 / 驳回与用户封禁。

### Modified Capabilities

（无——这是一个全新项目。）

## Impact

- 新建代码库：Next.js 15（App Router）+ TypeScript、Tailwind CSS + shadcn/ui，部署于 Vercel 免费版。
- 数据与认证：Supabase（Postgres、Auth、Storage），使用 Row Level Security 落实权限。
- 外部依赖：Waline（评论）、Markdown 编辑器与渲染组件。
- 不涉及既有系统或数据迁移；当前仓库为空。
- 非目标（v1）：关注 / 私信 / 通知、富文本编辑、付费与会员、移动端 App。
