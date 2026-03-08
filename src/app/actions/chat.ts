"use server";

import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import type {
  Topic,
  Constraint,
  ChatMessage,
  ChatResponse,
  AnswerMeta,
} from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

type ChatActionInput = {
  messages: ChatMessage[];
  topic: Topic;
  constraint: Constraint;
  questionIndex: number;
  answerMeta?: AnswerMeta;
};

export async function chatAction(input: ChatActionInput): Promise<ChatResponse> {
  try {
    const rateLimitResult = await checkRateLimit();
    if (!rateLimitResult.allowed) {
      return { success: false, error: rateLimitResult.message };
    }

    const systemPrompt = buildSystemPrompt(
      input.topic,
      input.constraint,
      input.questionIndex
    );

    const apiMessages = input.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        error: "あれ、ちょっと頭がバグりました。もう一度送ってもらえますか？",
      };
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: textBlock.text,
    };

    return {
      success: true,
      message: assistantMessage,
      questionIndex: input.questionIndex,
    };
  } catch {
    return {
      success: false,
      error: "すみません、ちょっとシステムの調子が悪いみたいです。もう一度試してもらえますか？",
    };
  }
}
