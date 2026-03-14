import { readdir } from "node:fs/promises";
import { join } from "node:path";

const rootDir = process.argv[2];

if (!rootDir) {
  console.error("Usage: bun generate-index.ts <folder>");
  process.exit(1);
}

async function walk(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });

  const exports: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(full);
      const subEntries = await readdir(full);
      if (subEntries.includes("index.ts")) {
        exports.unshift(`export * from "./${entry.name}";`);
      }

      continue;
    }

    if (
      entry.isFile() &&
      entry.name.split(".").length === 2 &&
      entry.name.endsWith(".ts") &&
      entry.name !== "index.ts"
    ) {
      const name = entry.name.replace(".ts", "");
      exports.push(`export * from "./${name}";`);
    }
  }

  if (exports.length) {
    const indexPath = join(dir, "index.ts");
    await Bun.write(indexPath, exports.join("\n") + "\n");
    console.log(`Generated ${indexPath}`);
  }
}

await walk(rootDir);