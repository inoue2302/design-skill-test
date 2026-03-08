/**
 * ナレッジベースを Upstash Vector に投入するスクリプト
 *
 * 使い方:
 *   npm run seed
 *
 * 環境変数（.env.local に設定）:
 *   UPSTASH_VECTOR_REST_URL
 *   UPSTASH_VECTOR_REST_TOKEN
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Index } from "@upstash/vector";
import { readFile } from "fs/promises";

type KnowledgeMetadata = {
  category: string;
  title: string;
  source: string;
};

const loadEnv = async () => {
  try {
    const envContent = await readFile(join(process.cwd(), ".env.local"), "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    console.log("⚠ .env.local not found, using existing env vars");
  }
};

const splitIntoChunks = (content: string, maxChunkSize = 500): string[] => {
  const sections = content.split(/\n## /);
  const chunks: string[] = [];

  for (const section of sections) {
    const text = section.startsWith("# ") ? section : `## ${section}`;
    if (text.length <= maxChunkSize) {
      chunks.push(text.trim());
    } else {
      const lines = text.split("\n");
      let chunk = "";
      for (const line of lines) {
        if (chunk.length + line.length > maxChunkSize && chunk.length > 0) {
          chunks.push(chunk.trim());
          chunk = "";
        }
        chunk += line + "\n";
      }
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
  }

  return chunks.filter((c) => c.length > 20);
};

const main = async () => {
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    console.error("❌ Cannot run seed in production (set VERCEL=1 to override)");
    process.exit(1);
  }

  await loadEnv();

  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (!url || !token) {
    console.error("❌ UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN are required");
    process.exit(1);
  }

  const index = new Index<KnowledgeMetadata>({ url, token });

  console.log("🗑  Resetting index...");
  await index.reset();

  const knowledgeDir = join(
    process.cwd(),
    "src",
    "data",
    "knowledge",
    "evaluation"
  );
  const files = readdirSync(knowledgeDir).filter((f) => f.endsWith(".md"));

  let totalChunks = 0;

  for (const file of files) {
    const category = file.replace(".md", "");
    const content = readFileSync(join(knowledgeDir, file), "utf-8");
    const title = content.match(/^# (.+)/)?.[1] ?? category;
    const chunks = splitIntoChunks(content);

    console.log(`📄 ${file}: ${chunks.length} chunks`);

    const vectors = chunks.map((chunk, i) => ({
      id: `${category}-${i}`,
      data: chunk,
      metadata: {
        category,
        title,
        source: file,
      } satisfies KnowledgeMetadata,
    }));

    const batchSize = 10;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }

    totalChunks += chunks.length;
  }

  console.log(`\n✅ Seeded ${totalChunks} chunks from ${files.length} files`);
};

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
