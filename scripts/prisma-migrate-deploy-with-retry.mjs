import { spawn } from "node:child_process";

const MAX_ATTEMPTS = Number.parseInt(process.env.PRISMA_MIGRATE_DEPLOY_ATTEMPTS ?? "5", 10);
const BASE_DELAY_MS = Number.parseInt(process.env.PRISMA_MIGRATE_DEPLOY_RETRY_DELAY_MS ?? "15000", 10);
const RETRYABLE_PATTERNS = [
  /P1002/i,
  /advisory lock/i,
  /pg_advisory_lock/i,
  /timed out/i,
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runMigrateDeploy(attempt) {
  return new Promise((resolve) => {
    console.log(`Running Prisma migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})...`);

    const child = spawn("npx", ["prisma", "migrate", "deploy"], {
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      output += message;
      console.error(message);
      resolve({ exitCode: 1, output });
    });

    child.on("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, output });
    });
  });
}

function shouldRetry(output) {
  return RETRYABLE_PATTERNS.some((pattern) => pattern.test(output));
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = await runMigrateDeploy(attempt);

  if (result.exitCode === 0) {
    process.exit(0);
  }

  if (attempt === MAX_ATTEMPTS || !shouldRetry(result.output)) {
    console.error(`Prisma migrate deploy failed after ${attempt} attempt${attempt === 1 ? "" : "s"}.`);
    process.exit(result.exitCode);
  }

  const delayMs = BASE_DELAY_MS * attempt;
  console.warn(
    `Prisma migrate deploy hit a retryable database/advisory-lock timeout. Retrying in ${Math.round(
      delayMs / 1000,
    )}s...`,
  );
  await wait(delayMs);
}
