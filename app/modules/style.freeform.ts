import type { PromptKeyModule } from "./types";
import { StyleModule as SemanticStyleModule } from "./style.semantic";
import { appendFreeformOption } from "./freeformOptions";

function freeformField(fieldId: string, categorized = false) {
  const field = SemanticStyleModule.fields[fieldId];

  return {
    ...field,
    options: appendFreeformOption(field.options, categorized
      ? { category: "custom", categoryLabel: "Custom" }
      : {}),
  };
}

export const StyleModule = {
  ...SemanticStyleModule,
  fields: {
    ...SemanticStyleModule.fields,
    aesthetic: freeformField("aesthetic"),
    medium: freeformField("medium", true),
    linework: freeformField("linework"),
    visualTreatment: freeformField("visualTreatment"),
    finish: freeformField("finish"),
  },
} satisfies PromptKeyModule;
