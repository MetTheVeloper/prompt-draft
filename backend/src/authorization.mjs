export const USER_ROLES = Object.freeze([
  'user',
  'admin',
  'super_admin',
])

export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: 'dashboard.view',
  SYSTEM_METRICS_VIEW: 'system.metrics.view',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  DRAFTS_VIEW_ALL: 'drafts.view_all',
  DRAFTS_DELETE_ANY: 'drafts.delete_any',
  SYSTEM_SETTINGS_MANAGE: 'system.settings.manage',
})

const ROLE_PERMISSIONS = Object.freeze({
  user: Object.freeze([]),
  admin: Object.freeze([
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SYSTEM_METRICS_VIEW,
    PERMISSIONS.USERS_VIEW,
  ]),
  super_admin: Object.freeze(['*']),
})

export function normalizeUserRole(value) {
  return USER_ROLES.includes(value) ? value : 'user'
}

export function resolvePermissionsForRole(role) {
  const normalizedRole = normalizeUserRole(role)
  return [...(ROLE_PERMISSIONS[normalizedRole] ?? [])]
}

export function hasPermission(user, permission) {
  if (!user || typeof permission !== 'string' || !permission.trim()) {
    return false
  }

  const permissions = resolvePermissionsForRole(user.role)
  return permissions.includes('*') || permissions.includes(permission)
}

export function getAuthorizationPayload(user) {
  return {
    role: normalizeUserRole(user?.role),
    permissions: resolvePermissionsForRole(user?.role),
  }
}
