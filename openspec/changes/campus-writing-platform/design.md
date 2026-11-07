# Design

## Context

全新空仓库，无既有代码或数据可兼容。这是一个练手 / 作品集项目，不是真实运营的社区；因此设计的首要目标是**完整、可演示、能讲清楚**，而不是高并发或合规规模。免费托管（Vercel + Supabase）是硬约束。内容以中文校园写作为主，这会影响搜索方案。审核流程是产品的核心叙事，状态机与权限必须在数据层真正落地，而不只是界面上的按钮。

## Goals / Non-Goals

**Goals:**

- 一个仓库、一种语言（TypeScript）完成从注册到发布的完整全栈闭环。
- 权限在应用层与数据库层双重落实，可演示、可审计。
- 全部运行在免费额度内，并提供种子数据与演示账号，便于展示。
- 代码结构与决策能直接用于作品集讲解。

**Non-Goals:**

- 真实运营所需的实名、许可、内容审核团队。
- 高并发、水平扩展、多地域部署。
- 多校园 / 多租户隔离。
- 移动 App、富文本编辑器、支付与会员。
- 中文高级全文检索（v1 用简单匹配，保留升级路径）。

## Decisions

### D1: Next.js 15 App Router + TypeScript，单仓库

前端页面用 Server Components 直接读数据，写操作走 Server Actions，鉴权在中间件与操作入口统一处理。

- 备选：Astro / SvelteKit —— 更轻，但全栈叙事与就业相关性不如 Next.js。
- 备选：前后端分离（独立 API 服务）—— 多一套部署与跨域配置，对练手项目收益不大。

### D2: Supabase 提供 Auth、Postgres 与 Storage

登录、数据库、对象存储一次配齐，并且能练到真实的 Postgres 与 RLS 权限设计。

- 备选：自写认证 + Prisma/Neon —— 学得更多，但工作量大且免费组合更复杂。
- 备选：Firebase —— NoSQL 与权限模型不同，SQL 练习价值较低。

### D3: 权限双层：应用层检查 + RLS

RLS 是最后一道闸，防止前端绕过；应用层负责路由保护和友好错误。管理员判断通过 `security definer` 的 `is_admin()` SQL 函数完成，避免 `profiles` 表策略递归。

策略草图：

| 表 | 公开读 | 作者 | 管理员 |
|---|---|---|---|
| `profiles` | 可读公开字段 | 仅更新自己的资料字段 | 可更新角色与封禁状态 |
| `posts` | 仅 `published` | 读写自己的全部文章 | 读写全部 |
| `tags` / `post_tags` | 可读 | 可关联自己的文章 | 全部 |
| `moderation_actions` | 不可读 | 仅读与自己相关 | 全部 |

- 备选：仅应用层校验 —— 单点绕过即全部失守。
- 备选：仅 RLS —— 错误信息不友好，管理操作编排困难。

### D4: 内容状态机（五态）

```
                 submit                approve
   +-------+  ----------->  +---------+  -------->  +-----------+
   | draft |                | pending |             | published |
   +-------+                +---------+  <--------  +-----------+
       ^                         |        submit         |
       |                         | reject               | remove
       |                         v                      v
       |                    +----------+          +---------+
       +---- edit ----------| rejected |          | removed |
         (then resubmit)    +----------+          +---------+
                               edit -> resubmit
```

许可的转移只有这些：

- `draft -> pending`：作者提交。
- `pending -> published | rejected`：管理员决定；驳回必须带理由。
- `published -> removed`：管理员下架；必须带理由。
- `rejected | removed -> pending`：作者修改后重新提交。

约束落在数据库：`status` 使用枚举或 check 约束；状态转移由 Server Action 校验，RLS 与触发器阻止非法写入。

编辑规则：`pending` 状态锁定编辑（避免审核期间内容变化）；`draft`、`rejected`、`removed` 可编辑；`published` 允许作者直接编辑，改动即时生效，管理员仍可下架。发布后编辑不重新送审是 v1 的取舍，后续可升级为“编辑即回待审”。

### D5: Markdown 渲染与安全

- 存储原始 Markdown；文章页在服务端渲染，写作页在客户端实时预览，两处共用同一渲染管线。
- 使用 `react-markdown` + `remark-gfm` + `rehype-sanitize`，代码块做高亮；不启用原始 HTML 或 MDX。
- 所有渲染结果在服务端也做消毒，不直接信任客户端输出。
- 备选：MDX —— 表达能力更强，但攻击面更大；富文本 —— 复杂度高，不符合练手范围。

### D6: 中文搜索

v1 使用 `ILIKE '%关键词%'` 匹配标题、摘要与正文，并启用 `pg_trgm` 扩展建立 GIN 索引。

原因：Postgres 默认全文检索不切分中文，中文没有空格，`tsvector` 效果差；`pg_trgm` 对中文子串匹配更实用，且数据量小的时候足够。

升级路径：数据量变大后换 Meilisearch / Typesense，或安装 `zhparser` 做中文分词。搜索行为契约不变，替换实现不影响规格。

### D7: 内置评论（Supabase）

评论与文章、用户一样存放在 Supabase Postgres。任何访客可读取已发布文章的评论；只有已登录且状态正常的用户可以在已发布文章下发表评论。作者可删除自己的评论，管理员可删除任意评论。评论正文按纯文本渲染，长度限制 1000 字。

- 备选：Waline 独立部署 —— 需要额外服务与数据库连接，免费方案下运维成本高。
- 备选：Giscus —— 需要 GitHub 登录，对校园用户门槛偏高。
- 风险：没有敏感词过滤；通过“登录后才能评论 + 管理员删除”控制，后续可接入过滤词表。

### D8: 数据模型

```
auth.users (Supabase)
    |
    v
profiles --< posts --< post_tags >-- tags
    |            |
    |            +--< comments
    |            +--< moderation_actions (target posts)
    +--< moderation_actions (target users)
```

关键字段：

- `profiles`：`id`（关联 `auth.users`）、`username`（唯一）、`display_name`、`bio`、`avatar_url`、`role`（reader / author / admin，默认 author）、`status`（active / banned）、时间戳。
- `posts`：`id`、`author_id`、`title`、`slug`（唯一）、`summary`、`content_md`、`cover_url`、`status`、`published_at`、`submitted_at`、`moderation_reason`（最近一次理由）、时间戳。
- `tags` / `post_tags`：标签与多对多关联。
- `comments`：`post_id`、`author_id`、`content`（纯文本）、`created_at`；随文章删除级联。
- `moderation_actions`：操作人、目标类型与 id、动作（approve / reject / remove / ban / unban）、理由、时间；作为审计日志的事实来源。

索引：`(status, published_at desc)`、`author_id`、`slug`、搜索字段的 trigram GIN 索引、`post_tags(tag_id)`。

URL 使用短 slug（ASCII 标题自动生成，中文标题用 nanoid 兜底），避免中文转拼音的额外依赖。

### D9: 部署、迁移与种子数据

- Supabase 项目免费版；SQL 迁移纳入仓库 `supabase/migrations`，用 Supabase CLI 执行。
- Vercel 连接 Git 仓库，按环境注入 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`（仅服务端）、`WALINE_URL`。
- 提供 seed 脚本：一名管理员、两名作者、若干已发布文章与标签、一篇待审文章，便于演示审核流。
- 演示阶段关闭邮箱确认（免费 SMTP 限额低）；需要时再接入自定义 SMTP 或 OAuth。
- 免费版 Supabase 闲置会休眠，首次访问较慢；用定时请求保活或接受这一表现。

### D10: 测试策略

- Vitest：状态转移、权限判断、输入校验等纯函数。
- SQL 测试脚本：验证非管理员无法修改状态、未发布文章不可公开读取等 RLS 行为。
- Playwright 冒烟（可选）：注册 → 写作 → 提交 → 管理员通过 → 公开可见。
- GitHub Actions 运行 lint 与测试，作为作品集的工程化展示。

## Risks / Trade-offs

- [Supabase 免费版闲置休眠] → 定时保活，或在 README 说明首次访问较慢。
- [Vercel 国内访问不稳定] → 绑定自定义域名；演示时本地运行；接受练手阶段的限制。
- [免费邮件额度低] → 关闭邮箱确认，后续接 OAuth 或自定义 SMTP。
- [RLS 策略写错导致越权] → 用 SQL 测试覆盖关键策略；管理员判断集中到 `is_admin()`。
- [中文搜索质量一般] → `pg_trgm` 子串匹配；保留更换搜索引擎的路径。
- [评论缺少敏感词过滤] → 登录后才能评论，管理员可删除；后续可接入过滤词表。
- [发布后编辑不重新审核] → 管理员可下架；后续迭代加入“编辑即回待审”。
- [Markdown XSS] → 服务端与客户端统一消毒，禁用原始 HTML。
- [演示账号泄露] → 仅用于演示环境，README 明示，不用于生产。

## Migration Plan

全新项目，无数据迁移。

1. 创建 Supabase 项目，执行迁移并运行 seed。
2. 在 Vercel 配置环境变量并连接仓库。
3. 部署后按冒烟流程验证：注册 → 写作 → 提交 → 审核 → 公开阅读。
4. 回滚：回退部署版本；数据库用迁移向前修复，项目初期不保留生产数据。

## Open Questions

- 平台名称与视觉风格：可在实现阶段再定，不影响架构与规格。
- 是否在注册流程加入 Turnstile 人机验证：先不加，出现垃圾注册再启用。
