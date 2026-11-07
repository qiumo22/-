# 审核与用户管理

管理后台只对 `role = 'admin'` 且 `status = 'active'` 的用户开放。非管理员访问 `/admin` 会被重定向到 `/unauthorized`。

## 管理页面

| 页面           | 作用                                                                |
| -------------- | ------------------------------------------------------------------- |
| `/admin`       | 待审队列：按提交时间升序展示 `pending` 文章，可查看全文、通过或驳回 |
| `/admin/posts` | 已发布文章：可查看公开页面，或填写理由后下架                        |
| `/admin/users` | 用户列表：展示角色与状态，可填写理由封禁用户，或解封                |
| `/admin/log`   | 操作记录：最近 100 条审核、下架、封禁、解封记录                     |

## 文章审核流程

```
  作者提交                      管理员通过
draft ------> pending ----------------------> published
                |
                | 管理员驳回（必须填写理由）
                v
            rejected
                |
                | 作者修改后重新提交
                +-------> pending

published --管理员下架（必须填写理由）--> removed
removed --作者修改后重新提交--> pending
```

- 通过：`pending -> published`，记录 `published_at`、`moderated_by`、`moderated_at`。
- 驳回：`pending -> rejected`，必须填写 `moderation_reason`，作者在“我的文章”中可以看到理由。
- 下架：`published -> removed`，必须填写理由，文章立即从首页、标签页、作者主页和搜索结果中消失。
- 作者修改被驳回或被下架的文章后，可以重新提交进入待审队列。

状态转移由数据库触发器 `enforce_post_transition` 强制执行；即使绕过界面直接调用 API，非法转移也会被拒绝。

## 用户封禁

- 封禁必须填写理由，并写入 `moderation_actions`。
- 被封禁用户不能登录：登录操作会检查 `profiles.status`，发现封禁后立即注销会话。
- 已登录的封禁用户访问受保护页面时，`requireActiveUser()` 会注销会话并跳转到登录页。
- 被封禁用户的公开资料与其已发布文章会通过 `is_active_author()` / RLS 从公开查询中隐藏。
- 管理员不能封禁自己，也不能封禁其他管理员。

## 审计日志

每次审核、下架、封禁、解封都会向 `moderation_actions` 写入一条记录：

| 字段          | 含义                                              |
| ------------- | ------------------------------------------------- |
| `actor_id`    | 执行操作的管理员                                  |
| `target_type` | `post` 或 `user`                                  |
| `target_id`   | 文章或用户的 ID                                   |
| `action`      | `approve` / `reject` / `remove` / `ban` / `unban` |
| `reason`      | 理由；驳回、下架、封禁必须非空                    |
| `created_at`  | 操作时间                                          |

`moderation_actions` 只有管理员可读、可写，普通用户和匿名访客无法访问。

## 验证

```bash
# 完整文章流程：草稿 -> 提交 -> 驳回 -> 重新提交 -> 通过 -> 下架 -> 再提交
# 以及封禁 / 解封对公开可见性的影响、审计日志读写
npm run verify:posts

# 匿名 / 作者 / 管理员的 RLS 权限边界
npm run verify:rls
```
