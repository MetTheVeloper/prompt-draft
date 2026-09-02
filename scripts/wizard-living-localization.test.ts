import assert from "node:assert/strict";
import test from "node:test";

import wizardEn from "../i18n/locales/wizard.en";
import wizardResumeEn from "../i18n/locales/wizard-resume.en";
import wizardFa from "../i18n/locales/wizard.fa";
import { portraitWizardV2Definition } from "../app/wizard/definition";
import {
  localizePortraitLivingQuestion,
  localizePortraitLivingSentenceParams,
  type PortraitLivingUiLocalizer,
} from "../app/wizard/portraitLivingLocalization";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!isRecord(value)) return prefix ? [prefix] : [];
  return Object.entries(value).flatMap(([key, item]) =>
    leafPaths(item, prefix ? `${prefix}.${key}` : key),
  );
}

function lookup(source: unknown, key: string): unknown {
  const parts = key.replace(/^wizard\./, "").split(".");
  let current: unknown = source;
  for (const part of parts) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }
  return current;
}

const faLocalizer: PortraitLivingUiLocalizer = {
  t: (key, params = {}) => {
    const raw = lookup(wizardFa, key);
    if (typeof raw !== "string") return key;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
      params[name] === undefined ? `{${name}}` : String(params[name]),
    );
  },
  te: (key) => typeof lookup(wizardFa, key) === "string",
};

test("Persian Living locale covers every existing English Living UI key", () => {
  const english = {
    living: {
      ...wizardEn.living,
      ...wizardResumeEn.living,
    },
  };
  const missing = leafPaths(english)
    .filter((path) => lookup(wizardFa, `wizard.${path}`) === undefined);
  assert.deepEqual(missing, []);
});

test("canonical Wizard values stay stable while presentation labels localize", () => {
  const question = portraitWizardV2Definition.steps
    .flatMap((step) => [...step.questions])
    .find((item) => item.id === "expressionIntent");
  assert.ok(question && question.type === "singleChoice");

  const localized = localizePortraitLivingQuestion(question, faLocalizer);
  assert.equal(localized.options[0]?.value, "natural");
  assert.equal(localized.options[0]?.label, "طبیعی");
  assert.equal(localized.options[1]?.value, "confident");
  assert.equal(localized.options[1]?.label, "بااعتمادبه‌نفس");
});

test("Persian sentence interpolation does not leak raw option values or fallback Person labels", () => {
  const expression = localizePortraitLivingSentenceParams(
    faLocalizer,
    "wizard.living.sentence.override.expression",
    { name: "Person 1", value: "serious" },
  );
  assert.equal(expression?.name, "شخص 1");
  assert.equal(expression?.value, "جدی");

  const custom = localizePortraitLivingSentenceParams(
    faLocalizer,
    "wizard.living.sentence.override.customDetails",
    { name: "Person 2", domain: "pose" },
  );
  assert.equal(custom?.name, "شخص 2");
  assert.equal(custom?.domain, "ژست");
});
