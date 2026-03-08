import { Index } from "@upstash/vector";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL ?? "",
  token: process.env.UPSTASH_VECTOR_REST_TOKEN ?? "",
});

type VectorSearchResult = {
  id: string;
  content: string;
  score: number;
};

export async function searchEvaluationKnowledge(
  query: string,
  topK: number = 3
): Promise<VectorSearchResult[]> {
  try {
    const results = await index.query({
      data: query,
      topK,
      includeMetadata: true,
    });

    return results.map((r) => ({
      id: String(r.id),
      content: (r.metadata as Record<string, string>)?.content ?? "",
      score: r.score,
    }));
  } catch {
    return [];
  }
}
