import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/systemPrompts";
import { getUserId, loadMemories, loadSharedMemories } from "@/lib/memory";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      userId: userIdParam,
      userName,
      module,
      imageBase64,
      imageMediaType,
    } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      userId: string;
      userName: "alejandro" | "rut";
      module: string;
      imageBase64?: string;
      imageMediaType?: string;
    };

    if (!messages || !userName || !module) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Load memories
    const isShared = ["plans", "italian", "chat"].includes(module);
    let memoriesText = "";
    let sharedMemoriesText = "";

    try {
      if (userIdParam && userIdParam !== userName) {
        memoriesText = await loadMemories(userIdParam);
      }
      if (isShared) {
        sharedMemoriesText = await loadSharedMemories();
      }
    } catch {
      // Proceed without memories if DB unavailable
    }

    const systemPrompt = buildSystemPrompt(
      userName,
      module,
      memoriesText || undefined,
      sharedMemoriesText || undefined
    );

    // Build message list, injecting image into the last user message if provided
    const anthropicMessages = messages.map((m, i) => {
      const isLastUserMessage = i === messages.length - 1 && m.role === "user" && imageBase64;
      if (isLastUserMessage) {
        return {
          role: m.role as "user" | "assistant",
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: (imageMediaType ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64!,
              },
            },
            { type: "text" as const, text: m.content },
          ],
        };
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    });

    // Stream response
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Return as SSE stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
