import {
  portraitWizardV2Definition as portraitWizardV2CoreDefinition,
  type WizardDefinition,
  type WizardQuestionDefinition,
} from "./definitionCore";
import { portraitPoseOptionsQuestion } from "./portraitPoseOptions";

export * from "./definitionCore";

function buildPortraitWizardV2Definition(): WizardDefinition {
  return {
    ...portraitWizardV2CoreDefinition,
    steps: portraitWizardV2CoreDefinition.steps.map((step) => {
      if (step.id !== "composition") return step;

      const questions: WizardQuestionDefinition[] = [];
      for (const question of step.questions) {
        questions.push(
          question.id === "poseSubjectOverrides" &&
            question.type === "subjectOverrides"
            ? {
                ...question,
                description:
                  "Keep the shared pose for everyone, or customize pose details for individual people.",
                sharedOptionsAnswerId: "poseOptions",
              }
            : question,
        );

        if (question.id === "poseIntent") {
          questions.push(portraitPoseOptionsQuestion);
        }
      }

      return { ...step, questions };
    }),
  };
}

export const portraitWizardV2Definition = buildPortraitWizardV2Definition();
