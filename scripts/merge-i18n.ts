import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import prettier from "prettier";

type LocaleObject = Record<string, any>;
type FlatPatch = Record<string, string>;

type CliOptions = {
  locale: string;
  file: string;
  patch: string;
  write: boolean;
  overwrite: boolean;
};

function getArg(name: string, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);

  if (index === -1) return fallback;

  return process.argv[index + 1] || fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getOptions(): CliOptions {
  const locale = getArg("locale", "en");

  return {
    locale,
    file: getArg("file", `i18n/locales/${locale}.ts`),
    patch: getArg("patch", `scripts/i18n-patches/${locale}.missing.ts`),
    write: hasFlag("write"),
    overwrite: hasFlag("overwrite"),
  };
}

async function importDefault<T>(filePath: string): Promise<T> {
  const absolutePath = path.resolve(filePath);
  const fileUrl = pathToFileURL(absolutePath).href;
  const imported = await import(`${fileUrl}?t=${Date.now()}`);

  return imported.default as T;
}

function flatToNested(flatPatch: FlatPatch) {
  const result: LocaleObject = {};

  for (const [key, value] of Object.entries(flatPatch)) {
    const parts = key.split(".").filter(Boolean);

    if (!parts.length) continue;

    let current = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current[part] = value;
        continue;
      }

      current[part] ||= {};
      current = current[part];
    }
  }

  return result;
}

function isPlainObject(value: unknown): value is LocaleObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMergeMissing(
  target: LocaleObject,
  patch: LocaleObject,
  options: {
    overwrite: boolean;
    path?: string[];
    added: string[];
    skipped: string[];
    overwritten: string[];
  },
) {
  for (const [key, value] of Object.entries(patch)) {
    const currentPath = [...(options.path || []), key];
    const dotPath = currentPath.join(".");

    if (isPlainObject(value)) {
      if (!isPlainObject(target[key])) {
        target[key] = {};
      }

      deepMergeMissing(target[key], value, {
        ...options,
        path: currentPath,
      });

      continue;
    }

    const exists = Object.prototype.hasOwnProperty.call(target, key);

    if (!exists) {
      target[key] = value;
      options.added.push(dotPath);
      continue;
    }

    if (options.overwrite) {
      target[key] = value;
      options.overwritten.push(dotPath);
      continue;
    }

    options.skipped.push(dotPath);
  }

  return target;
}

async function formatTs(code: string) {
  return prettier.format(code, {
    parser: "typescript",
    semi: false,
    trailingComma: "all",
    printWidth: 100,
  });
}

async function main() {
  const options = getOptions();

  const localeObject = await importDefault<LocaleObject>(options.file);
  const flatPatch = await importDefault<FlatPatch>(options.patch);

  const nestedPatch = flatToNested(flatPatch);

  const stats = {
    added: [] as string[],
    skipped: [] as string[],
    overwritten: [] as string[],
  };

  const merged = deepMergeMissing(structuredClone(localeObject), nestedPatch, {
    overwrite: options.overwrite,
    added: stats.added,
    skipped: stats.skipped,
    overwritten: stats.overwritten,
  });

  const output = await formatTs(
    `export default ${JSON.stringify(merged, null, 2)}\n`,
  );

  const targetFile = path.resolve(options.file);
  const outputFile = options.write
    ? targetFile
    : path.resolve(options.file.replace(/\.ts$/, ".merged.ts"));

  if (options.write) {
    const backupFile = `${targetFile}.bak.${Date.now()}`;
    await fs.copyFile(targetFile, backupFile);
    console.log(`Backup created: ${backupFile}`);
  }

  await fs.writeFile(outputFile, output, "utf8");

  console.log("");
  console.log(`Locale: ${options.locale}`);
  console.log(`Patch: ${options.patch}`);
  console.log(`Output: ${outputFile}`);
  console.log("");
  console.log(`Added: ${stats.added.length}`);
  console.log(`Skipped existing: ${stats.skipped.length}`);
  console.log(`Overwritten: ${stats.overwritten.length}`);

  if (stats.skipped.length) {
    console.log("");
    console.log("Skipped keys:");
    console.log(stats.skipped.join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
