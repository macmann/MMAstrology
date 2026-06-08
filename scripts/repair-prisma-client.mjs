#!/usr/bin/env node
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const prismaClientDir = join(process.cwd(), "node_modules", ".prisma", "client");

function removeStaleTemporaryEngines() {
  if (!existsSync(prismaClientDir)) {
    return;
  }

  for (const entry of readdirSync(prismaClientDir)) {
    if (entry.includes(".tmp")) {
      rmSync(join(prismaClientDir, entry), { force: true });
    }
  }
}

function runPrismaGenerate() {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  return spawnSync(executable, ["prisma", "generate"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });
}

removeStaleTemporaryEngines();
const result = runPrismaGenerate();

if (result.status === 0) {
  process.exit(0);
}

if (process.platform === "win32") {
  console.error(`
Prisma Client generation failed on Windows.

If the error mentions EPERM while renaming query_engine-windows.dll.node, a running Node/Next.js process is usually holding Prisma's query engine DLL open.

Fix:
1. Stop every running \`npm run dev\`, \`next dev\`, and Node.js process for this project.
2. Run this command again: \`npm run prisma:repair\`.
3. Restart the app with \`npm run dev\`.

After a schema migration, the database can be up to date while the generated Prisma Client is still stale. The app will keep throwing "Unknown field" errors until generation succeeds.
`);
}

process.exit(result.status ?? 1);
