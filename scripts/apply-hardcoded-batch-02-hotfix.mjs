#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const auditPath = path.join(ROOT, "scripts", "localization-audit.mjs");

let content = await fs.readFile(auditPath, "utf8");

const patched = `        if (\n          EXCLUDED_DIRS.has(entry.name) ||\n          /^\\.layout-stage\\d+-backup$/i.test(entry.name)\n        ) continue`;

if (!content.includes(patched)) {
  const current = `        if (EXCLUDED_DIRS.has(entry.name)) continue`;

  if (!content.includes(current)) {
    throw new Error(
      "Could not find the current localization-audit directory exclusion check.",
    );
  }

  content = content.replace(current, patched);
  await fs.writeFile(auditPath, content, "utf8");
  console.log("Patched: scripts/localization-audit.mjs");
} else {
  console.log("Already patched: scripts/localization-audit.mjs");
}

// Continue the original idempotent migration. Its audit step now detects the
// already-patched target and proceeds with the Hair / Outfit replacements.
await import("./apply-hardcoded-batch-02.mjs");
