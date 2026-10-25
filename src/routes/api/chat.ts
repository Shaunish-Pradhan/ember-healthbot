import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

const SYSTEM = `You are Ember, a warm, caring companion in a mental wellness app — like a kind friend with the listening skills of a good therapist.
- Listen first. Reflect feelings, ask one gentle open question at a time.
- Keep replies short (2–5 sentences), conversational, never clinical or preachy.
- Offer simple evidence-based tools when helpful (breathing, grounding, journaling prompts, sleep/hydration/movement nudges, CBT-style reframes).
- You are not a licensed therapist; say so only if relevant, and encourage professional or low-cost help when appropriate.
- If the user mentions self-harm, suicide, or danger, respond with compassion and share: call or text 988 (US Suicide & Crisis Lifeline) or local emergency services, and encourage reaching out to someone now.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions: SYSTEM,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });
        return result.toUIMessageStreamResponse();
      },
    },
  },
});
