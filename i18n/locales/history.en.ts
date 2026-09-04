export default {
  app: {
    navigation: {
      history: "History",
    },
  },
  history: {
    title: "History",
    subtitle: "Successful Wizard runs stored by Prompt Draft.",
    loading: "Loading history...",
    loadingMore: "Loading more...",
    actions: {
      refresh: "Refresh",
      retry: "Try again",
      loadMore: "Load more",
      back: "Back to history",
      open: "Open run",
      copy: "Copy prompt",
      copied: "Copied",
      showSnapshot: "Show stored snapshot",
      hideSnapshot: "Hide stored snapshot",
    },
    fields: {
      wizard: "Wizard run",
      created: "Created",
      runId: "Run ID",
      actions: "Actions",
    },
    empty: {
      title: "No history yet",
      description: "Successfully completed Wizard runs will appear here.",
    },
    error: {
      title: "History unavailable",
      description: "Prompt Draft could not load saved Wizard runs from the backend.",
      loadMore: "Could not load the next History page.",
    },
    run: {
      wizard: "{id} · v{version}",
    },
    detail: {
      title: "History run",
      description: "Review the compiled prompt and the exact snapshot stored for this Wizard run.",
      loading: "Loading run...",
      errorTitle: "Run unavailable",
      errorDescription: "This saved Wizard run could not be loaded.",
      output: "Compiled prompt",
      snapshot: "Stored snapshot",
    },
  },
};
