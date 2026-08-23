import type { PromptKeyModule } from "./types";
import { FormModule as SemanticFormModule } from "./form.semantic";
import {
  appendFreeformOption,
  collectOptionTags,
} from "./freeformOptions";

const proportionTags = Array.from(
  new Set([
    ...collectOptionTags(SemanticFormModule.fields.proportions.options),
    "custom",
  ]),
);

export const FormModule = {
  ...SemanticFormModule,
  fields: {
    ...SemanticFormModule.fields,
    formLanguage: {
      ...SemanticFormModule.fields.formLanguage,
      options: appendFreeformOption(
        SemanticFormModule.fields.formLanguage.options,
      ),
    },
    proportions: {
      ...SemanticFormModule.fields.proportions,
      options: appendFreeformOption(
        SemanticFormModule.fields.proportions.options,
        {
          category: "custom",
          categoryLabel: "Custom",
          tags: ["custom"],
        },
      ),
    },
    transformation: {
      ...SemanticFormModule.fields.transformation,
      options: appendFreeformOption(
        SemanticFormModule.fields.transformation.options,
        {
          category: "custom",
          categoryLabel: "Custom",
          compatibility: {
            discouragedTags: proportionTags,
          },
        },
      ),
    },
  },
} satisfies PromptKeyModule;
