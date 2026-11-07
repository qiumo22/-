# 数据库设计

本项目的数据库是 Supabase 上的 PostgreSQL。所有结构变更都保存在 `supabase/migrations/`，认证使用 Supabase Auth。

## 迁移

| 文件                              | 内容                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| `20261107092803_init_schema.sql`  | 枚举、业务表、更新时间触发器、注册时自动创建资料           |
| `20261107093812_indexes.sql`      | 用户名 / 标签唯一索引，列表索引，中文搜索 trigram 索引     |
| `20261107093818_rls_policies.sql` | 权限辅助函数、RLS 策略、状态机与字段保护触发器、Storage 桶 |
| `20261107110500_comments.sql`     | 内置评论表、索引与评论 RLS                                 |

### 执行方式

```bash
npm run db:push
```

脚本通过 Supabase Management API 执行迁移，并在 `public.applied_migrations` 记录已执行版本，重复运行会跳过。

如果本机无法使用 Management API，也可以把 `supabase/manual-migrations.sql`（三份迁移的合并版）粘贴到 Supabase Dashboard 的 SQL Editor 执行一次。

## 数据表

### `profiles`

| 列             | 说明                                                       |
| -------------- | ---------------------------------------------------------- |
| `id`           | 主键，关联 `auth.users(id)`，删除用户时级联删除            |
| `username`     | 唯一用户名，格式 `^[a-zA-Z0-9_-]{3,30}$`，大小写不敏感唯一 |
| `display_name` | 展示名                                                     |
| `bio`          | 简介                                                       |
| `avatar_url`   | 头像地址（Storage）                                        |
| `role`         | `reader` / `author` / `admin`，注册默认 `author`           |
| `status`       | `active` / `banned`                                        |
| 时间戳         | `created_at` / `updated_at`                                |

新用户注册时，`on_auth_user_created` 触发器自动创建资料，并生成不会冲突的用户名。

### `posts`

| 列                              | 说明                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `id`                            | 主键                                                       |
| `author_id`                     | 作者，关联 `profiles`                                      |
| `title` / `slug`                | 标题与唯一 URL 标识                                        |
| `summary` / `content_md`        | 摘要与 Markdown 正文                                       |
| `cover_url`                     | 封面地址（Storage）                                        |
| `status`                        | `draft` / `pending` / `published` / `rejected` / `removed` |
| `published_at`                  | 发布时间，`published` 状态必填                             |
| `submitted_at`                  | 最近一次提交审核时间                                       |
| `moderation_reason`             | 最近一次驳回 / 下架理由                                    |
| `moderated_by` / `moderated_at` | 最近一次审核操作人与时间                                   |
| 时间戳                          | `created_at` / `updated_at`                                |

### `tags` / `post_tags`

标签与文章多对多关联。标签名大小写不敏感唯一。

### `comments`

内置评论：`post_id`、`author_id`、`content`（纯文本，1–1000 字）、`created_at`。评论随文章或作者删除级联删除。只有登录且状态正常的用户可以在已发布文章下发表评论；作者和管理员可以删除评论。

### `moderation_actions`

审核审计日志：`actor_id`、`target_type`（`post` / `user`）、`target_id`、`action`（`approve` / `reject` / `remove` / `ban` / `unban`）、`reason`、`created_at`。`reject`、`remove`、`ban` 必须填写理由。

### `applied_migrations`

迁移执行记录，仅由迁移脚本使用。

## 内容状态机

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

允许的转移只有：

- `draft -> pending`：作者提交。
- `pending -> published | rejected`：管理员审核；驳回必须带理由。
- `published -> removed`：管理员下架；必须带理由。
- `rejected | removed -> pending`：作者修改后重新提交。

`enforce_post_transition` 触发器在数据库层拒绝其他转移；`protect_post_fields` 阻止作者修改审核字段。

## 权限模型

所有业务表启用 RLS。核心判断：

- `is_admin()`：当前用户是 `active` 管理员。
- `is_active_user()`：当前用户未被封禁。
- `is_active_author(id)`：指定作者未被封禁。
- `can_read_post(id)`：已发布且作者未被封禁，或本人文章，或管理员。
- `can_edit_post(id)`：本人文章或管理员。

| 表                   | 匿名             | 作者                           | 管理员                   |
| -------------------- | ---------------- | ------------------------------ | ------------------------ |
| `profiles`           | 读 `active` 资料 | 改自己的资料                   | 读全部、改角色与封禁状态 |
| `posts`              | 读 `published`   | 读写自己的文章、删除非待审文章 | 读写删全部               |
| `tags`               | 读               | 新建                           | 改、删                   |
| `post_tags`          | 随文章可读       | 给自己的文章加删标签           | 全部                     |
| `comments`           | 随文章可读       | 在已发布文章下评论、删自己的   | 删除任意评论             |
| `moderation_actions` | 不可读           | 不可读写                       | 读、写                   |

被封禁用户不能登录；其已发布文章通过 `is_active_author()` 从公开页面隐藏。

Storage 使用两个公开读桶：`avatars` 与 `covers`。登录用户只能在自己的用户 ID 目录下上传、更新、删除文件。

## 验证

```bash
# 表、索引、策略
npm run db:query -- "select indexname from pg_indexes where schemaname = 'public' order by 1;"
npm run db:query -- "select tablename, policyname from pg_policies where schemaname = 'public';"

# 匿名 / 作者 / 管理员的可见性与越权测试
npm run verify:rls

# 评论读写与删除权限
npm run verify:comments
```

`verify-rls.mjs` 会以匿名、作者两种身份实际请求数据接口，验证：

- 匿名只能看到已发布文章。
- 匿名读不到审核日志。
- 作者不能修改他人文章。
- 作者不能自行把待审文章改为已发布。
- 作者之间不能互相读取待审文章。
- 作者能读取自己的待审文章。
