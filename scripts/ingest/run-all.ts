import { execSync } from "child_process";
import { resolve } from "path";

const scripts = [
  { name: "Embeddings", file: "generate-embeddings.ts" },
];

async function main() {
  console.log("=== Signaic Data Ingestion ===\n");
  const results: Record<string, string> = {};

  for (const script of scripts) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Running: ${script.name}`);
    console.log("=".repeat(50));

    try {
      const scriptPath = resolve(__dirname, script.file);
      execSync(`npx tsx "${scriptPath}"`, {
        stdio: "inherit",
        env: process.env,
        timeout: 600000, // 10 min timeout
      });
      results[script.name] = "SUCCESS";
    } catch (error) {
      console.error(`\n${script.name} failed:`, error);
      results[script.name] = "FAILED";
    }
  }

  console.log("\n\n=== INGESTION SUMMARY ===");
  for (const [name, status] of Object.entries(results)) {
    console.log(`  ${status === "SUCCESS" ? "✓" : "✗"} ${name}: ${status}`);
  }
}

main().catch(console.error);
