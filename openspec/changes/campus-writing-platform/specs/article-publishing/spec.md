# Spec Delta

## Purpose

让作者使用 Markdown 完成从草稿到发布的写作流程，并通过明确的状态模型决定文章何时对公众可见。

## ADDED Requirements

### Requirement: 创建与编辑草稿
作者 SHALL 能创建包含标题、正文（Markdown）、摘要、封面图片和标签的文章草稿，并可在提交审核前反复编辑或删除。一篇草稿 MUST 仅属于其作者。

#### Scenario: 创建草稿
- **WHEN** 已登录作者在写作页填写标题和正文并保存
- **THEN** 系统创建状态为 draft 的文章，并出现在作者的“我的文章”列表中

#### Scenario: 编辑自己的草稿
- **WHEN** 作者修改自己草稿的标题、正文或标签并保存
- **THEN** 系统保存变更，文章仍为 draft 状态

#### Scenario: 删除草稿
- **WHEN** 作者删除自己的草稿
- **THEN** 文章从作者列表和数据库中移除，公开页面不受影响

### Requirement: Markdown 预览与渲染
写作页 SHALL 提供 Markdown 输入与实时预览；已发布文章 SHALL 按 Markdown 渲染，并移除脚本等不安全内容。

#### Scenario: 实时预览
- **WHEN** 作者在编辑器中输入 Markdown
- **THEN** 预览区域同步显示渲染结果

#### Scenario: 渲染不安全内容
- **WHEN** 文章正文包含脚本或内联事件处理器
- **THEN** 公开文章页渲染时移除这些内容，不执行脚本

### Requirement: 提交审核
作者 SHALL 能将自己的草稿提交审核。提交后文章进入 pending 状态，在管理员处理前作者 MUST NOT 修改其内容。

#### Scenario: 提交草稿
- **WHEN** 作者对自己的 draft 文章选择“提交审核”
- **THEN** 文章状态变为 pending，并从作者草稿列表移入待审列表

#### Scenario: 提交非本人文章
- **WHEN** 用户尝试提交不属于自己的文章
- **THEN** 系统拒绝操作且文章状态不变

### Requirement: 文章状态流转
文章状态 MUST 只能是 draft、pending、published、rejected 或 removed。只有管理员能将 pending 改为 published 或 rejected；只有管理员能将 published 改为 removed；作者可将 rejected 或 removed 的文章修改后重新提交为 pending。只有 published 文章对公众可见。

#### Scenario: 管理员通过审核
- **WHEN** 管理员通过一篇 pending 文章
- **THEN** 文章变为 published，记录发布时间，并出现在公开列表与作者主页

#### Scenario: 管理员驳回文章
- **WHEN** 管理员驳回一篇 pending 文章并填写理由
- **THEN** 文章变为 rejected，作者可在自己的文章列表看到驳回状态与理由

#### Scenario: 修改后重新提交
- **WHEN** 作者修改一篇 rejected 文章并再次提交
- **THEN** 文章重新变为 pending，进入管理员待审队列

#### Scenario: 非管理员尝试改变状态
- **WHEN** 作者尝试直接把自己的 pending 文章改为 published
- **THEN** 系统拒绝该操作，文章状态保持不变

### Requirement: 封面图片与标签
作者 SHALL 能为文章上传封面图片并选择标签。封面 MUST 仅接受常见图片格式，大小不超过系统上限；标签可从已有标签中选择或新建。

#### Scenario: 上传合法封面
- **WHEN** 作者选择符合格式与大小限制的图片作为封面
- **THEN** 系统上传图片并保存文章封面地址

#### Scenario: 上传超大图片
- **WHEN** 作者选择超过大小上限的图片
- **THEN** 系统拒绝上传并提示限制

#### Scenario: 添加标签
- **WHEN** 作者为文章添加一个已有或新建的标签
- **THEN** 标签与文章关联，并在文章与标签页展示

### Requirement: 文章归属
每篇文章 MUST 有唯一作者。作者只能编辑或删除自己的文章，其他作者不能编辑他人文章。

#### Scenario: 编辑他人文章
- **WHEN** 作者尝试打开并保存另一位作者的文章编辑页
- **THEN** 系统拒绝保存且不修改原文
