import Anthropic from "@anthropic-ai/sdk";

export const aiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;

export function getAnthropicClient() {
  if (!aiConfigured) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export const CHAT_MODEL = "claude-opus-5";
