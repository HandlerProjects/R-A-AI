"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveConversation, loadConversation } from "@/lib/memory";

export interface Message {
  role: "user" | "assistant";
  content: string;
  image_url?: string;
}

interface UseChatStreamOptions {
  userId: string;
  userName: string;
  module: string;
  /** Si false, no persiste en Supabase. Por defecto true. */
  persist?: boolean;
}

interface SendOptions {
  imageBase64?: string;
  imageMediaType?: string;
  images?: { base64: string; mediaType: string }[];
}

export function useChatStream({ userId, userName, module, persist = true }: UseChatStreamOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationIdRef = useRef<string | undefined>(undefined);

  // Cargar historial al montar
  useEffect(() => {
    if (!persist || !userId) return;
    loadConversation(userId, module).then((conv) => {
      if (conv && conv.messages.length > 0) {
        setMessages(conv.messages as Message[]);
        conversationIdRef.current = conv.id;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, module]);

  const send = useCallback(
    async (content: string, opts?: SendOptions) => {
      if (isLoading) return;

      const userMessage: Message = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            userId,
            userName,
            module,
            ...(opts?.images
              ? { images: opts.images }
              : opts?.imageBase64
              ? { imageBase64: opts.imageBase64, imageMediaType: opts.imageMediaType ?? "image/jpeg" }
              : {}),
          }),
        });

        if (!response.ok || !response.body) throw new Error("Stream failed");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
              try {
                const t = JSON.parse(line.slice(6)).text;
                if (t) {
                  assistantContent += t;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }

        // Guardar conversación completa en Supabase
        if (persist) {
          try {
            const finalMessages = [...updatedMessages, { role: "assistant" as const, content: assistantContent }];
            const savedId = await saveConversation(userId, module, finalMessages, conversationIdRef.current);
            if (!conversationIdRef.current && savedId) {
              conversationIdRef.current = savedId;
            }
          } catch {}
        }
      } catch {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Lo siento, hubo un error. Inténtalo de nuevo." },
        ]);
      }
    },
    [isLoading, messages, userId, userName, module, persist]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    // No borramos conversationIdRef — el historial sigue en DB
  }, []);

  return { messages, setMessages, isLoading, send, reset };
}
