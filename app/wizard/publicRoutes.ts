export const publicWizardIds = ["portrait"] as const;
export const publicWizardRoutes = publicWizardIds.map((id) => `/wizard/${id}`);
