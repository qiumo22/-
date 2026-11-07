export const MODERATION_ACTION_LABELS: Record<string, string> = {
  approve: "通过",
  reject: "驳回",
  remove: "下架",
  ban: "封禁",
  unban: "解封",
};

export const MODERATION_DONE_MESSAGES: Record<string, string> = {
  approved: "文章已通过审核。",
  rejected: "文章已驳回。",
  removed: "文章已下架。",
  banned: "用户已封禁。",
  unbanned: "用户已解封。",
};

export const MODERATION_ERROR_MESSAGES: Record<string, string> = {
  missing: "缺少必要的参数。",
  reason: "请填写理由。",
  approve: "通过失败，请稍后再试。",
  reject: "驳回失败，请稍后再试。",
  remove: "下架失败，请稍后再试。",
  ban: "封禁失败，请稍后再试。",
  unban: "解封失败，请稍后再试。",
  self: "不能封禁自己。",
  admin: "不能封禁管理员。",
  notfound: "目标不存在。",
};
