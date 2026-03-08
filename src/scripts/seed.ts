import { Index } from "@upstash/vector";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL ?? "",
  token: process.env.UPSTASH_VECTOR_REST_TOKEN ?? "",
});

const KNOWLEDGE_DIR = join(
  process.cwd(),
  "src",
  "data",
  "knowledge",
  "evaluation"
);

async function seed() {
  console.log("🌱 Starting seed process...");

  const files = readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
  console.log(`📄 Found ${files.length} knowledge files`);

  // 既存データをリセット
  try {
    await index.reset();
    console.log("🗑️  Cleared existing vectors");
  } catch {
    console.log("ℹ️  No existing vectors to clear");
  }

  const vectors = files.map((file) => {
    const content = readFileSync(join(KNOWLEDGE_DIR, file), "utf-8");
    const id = file.replace(".md", "");
    return {
      id,
      data: content,
      metadata: { content, filename: file },
    };
  });

  // バッチでアップサート
  const BATCH_SIZE = 10;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await index.upsert(batch);
    console.log(
      `✅ Upserted ${Math.min(i + BATCH_SIZE, vectors.length)}/${vectors.length} vectors`
    );
  }

  console.log("🎉 Seed completed!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
