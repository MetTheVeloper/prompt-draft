#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, "scripts", "apply-hardcoded-batch-02.mjs");
const runtimePath = path.join(
  ROOT,
  "scripts",
  `.apply-hardcoded-batch-02-runtime-${process.pid}.mjs`,
);

const source = await fs.readFile(sourcePath, "utf8");
const auditStartMarker = `await patchFile("scripts/localization-audit.mjs", [`;
const hairStartMarker = `await patchFile("app/components/modules/hair/HairComponentCard.vue", [`;

const auditStart = source.indexOf(auditStartMarker);
const hairStart = source.indexOf(hairStartMarker);

if (auditStart === -1 || hairStart === -1 || hairStart <= auditStart) {
  throw new Error(
    "Could not locate the audit and Hair migration boundaries in apply-hardcoded-batch-02.mjs.",
  );
}

// The localization auditor has already been patched by the hotfix on the
// current working tree. Reuse the original migration implementation while
// skipping only its obsolete auditor replacement block.
const runtimeSource = source.slice(0, auditStart) + source.slice(hairStart);

await fs.writeFile(runtimePath, runtimeSource, "utf8");

try {
  await import(`${pathToFileURL(runtimePath).href}?v=${Date.now()}`);
} finally {
  await fs.rm(runtimePath, { force: true });
}
