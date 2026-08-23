export const HOMEPAGE_PERMISSIONS = [
  "homepage.view",
  "homepage.edit",
  "homepage.preview",
  "homepage.publish",
  "homepage.schedule",
  "homepage.rollback",
  "homepage.revisions.view",
  "homepage.campaigns.manage",
  "homepage.audit.view",
  "homepage.analytics.view",
] as const;

export type HomepagePermission = typeof HOMEPAGE_PERMISSIONS[number];

export const DEFAULT_ADMIN_PERMISSIONS: HomepagePermission[] = [
  "homepage.view",
  "homepage.edit",
  "homepage.preview",
  "homepage.revisions.view",
  "homepage.audit.view",
];
