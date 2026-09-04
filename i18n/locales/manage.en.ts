export default {
  manage: {
    title: "Manage",
    subtitle: "Administrative and system management workspace.",
    sections: {
      dashboard: {
        label: "Dashboard",
        description: "Live account, session, Cloud Draft, and administration summary.",
      },
      users: {
        label: "Users",
        description: "Browse account metadata and current Cloud usage.",
      },
    },
    common: {
      actions: {
        refresh: "Refresh",
        cancel: "Cancel",
        close: "Close",
        done: "Done",
        loadMore: "Load more",
      },
      roles: {
        user: "User",
        admin: "Admin",
        superAdmin: "Super admin",
        all: "All roles",
      },
      statuses: {
        active: "Active",
        suspended: "Suspended",
      },
      fields: {
        account: "Account",
        userId: "User ID",
        role: "Role",
        status: "Status",
        cloudDrafts: "Cloud drafts",
        activeSessions: "Active sessions",
        joined: "Joined",
        actions: "Actions",
      },
    },
    dashboard: {
      liveSummary: "Live server summary",
      lastUpdated: "Last updated {date}",
      loading: "Loading dashboard…",
      loadError: "Dashboard summary could not be loaded.",
      cards: {
        totalUsers: {
          label: "Total users",
          helper: "Registered accounts",
        },
        activeAccounts: {
          label: "Active accounts",
          helper: "Accounts allowed to sign in",
        },
        suspendedAccounts: {
          label: "Suspended accounts",
          helper: "Accounts blocked from signing in",
        },
        newUsersToday: {
          label: "New users today",
          helper: "Since 00:00 UTC",
        },
        activeSessions: {
          label: "Active sessions",
          helper: "Unexpired sessions on active accounts",
        },
        cloudDrafts: {
          label: "Cloud drafts",
          helper: "Drafts currently stored on the server",
        },
        draftsUpdatedToday: {
          label: "Drafts updated today",
          helper: "Server updates since 00:00 UTC",
        },
        adminActionsToday: {
          label: "Admin actions today",
          helper: "Audited mutations since 00:00 UTC",
        },
      },
    },
    users: {
      searchPlaceholder: "Search username or email",
      loading: "Loading users…",
      empty: "No users found.",
      loadError: "Failed to load users.",
      updatedTitle: "User updated",
      actionFailedTitle: "Action failed",
      actionFailedFallback: "The administrative action could not be completed.",
      selfManagementBlocked: "Self-management is blocked by the admin safety rules.",
      actions: {
        userActions: "User actions",
        changeRole: "Change role",
        suspendAccount: "Suspend account",
        unsuspendAccount: "Unsuspend account",
        revokeSessions: "Revoke sessions",
        resetCloudData: "Reset Cloud data",
        information: "Information",
        deleteCloudDrafts: "Delete Cloud Drafts",
      },
      roleChange: {
        title: "Change user role",
        description: "Select the new authorization role for this account. This changes the permissions resolved for future requests.",
        placeholder: "Select role",
        failedTitle: "Role change failed",
        failedFallback: "The user role could not be changed.",
        success: "{account} is now {role}.",
      },
      suspend: {
        title: "Suspend account?",
        description: "The account will be blocked from signing in and all current sessions will be revoked immediately.",
        success: "{account} has been suspended.",
      },
      unsuspend: {
        title: "Unsuspend account?",
        description: "The account will be allowed to sign in again. Previously revoked sessions are not restored.",
        success: "{account} can sign in again.",
      },
      revokeSessions: {
        title: "Revoke all sessions?",
        description: "Every active login session for this account will be invalidated. The user will need to sign in again on each device.",
        success: "All sessions for {account} were revoked.",
      },
      resetCloudData: {
        title: "Reset Cloud data?",
        description: "This permanently deletes all Cloud Drafts owned by this account. The account itself and its password are not deleted.",
        success: "Cloud Draft data for {account} was reset.",
      },
      information: {
        title: "User information",
        loading: "Loading user information…",
        loadError: "Failed to load user information.",
      },
    },
    errors: {
      forbiddenTitle: "Forbidden",
      forbiddenMessage: "You do not have permission to access the management workspace.",
    },
  },
};
