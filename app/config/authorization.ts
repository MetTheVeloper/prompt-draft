export const AUTH_PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  SYSTEM_METRICS_VIEW: "system.metrics.view",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  CREATORS_MANAGE: "creators.manage",
  DRAFTS_VIEW_ALL: "drafts.view_all",
  DRAFTS_DELETE_ANY: "drafts.delete_any",
  SYSTEM_SETTINGS_MANAGE: "system.settings.manage",
  COLLAGE_VIEW: "collage.view",
  ARCHIVE_VIEW: "archive.view",
  ARCHIVE_MANAGE: "archive.manage",
  BLOG_MANAGE: "blog.manage",
  TELEGRAM_MANAGE: "telegram.manage",
  MARKETING_CAMPAIGNS_VIEW: "marketing.campaigns.view",
  MARKETING_CAMPAIGNS_MANAGE: "marketing.campaigns.manage",
  MARKETING_CAMPAIGNS_PUBLISH: "marketing.campaigns.publish",
  MARKETING_METRICS_VIEW: "marketing.metrics.view",
} as const;

export type AuthPermission =
  (typeof AUTH_PERMISSIONS)[keyof typeof AUTH_PERMISSIONS];

export type AuthGrantedPermission = AuthPermission | "*";