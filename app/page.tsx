"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Lightbulb, Loader2, Sparkles, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";
import Link from "next/link";

const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = () => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };
    return JSON.parse(stored);
  } catch {
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (messages: UIMessage[], durations: Record<string, number>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, durations }));
  } catch {}
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef(false);

  const stored = typeof window !== "undefined" ? loadMessagesFromStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
  }, []);

  useEffect(() => {
    if (isClient) saveMessagesToStorage(messages, durations);
  }, [messages, durations, isClient]);

  useEffect(() => {
    if (isClient && initialMessages.length === 0 && !welcomeMessageShownRef.current) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: WELCOME_MESSAGE,
          },
        ],
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    sendMessage({ text: data.message });
    form.reset();
  };

  const clearChat = () => {
    setMessages([]);
    setDurations({});
    saveMessagesToStorage([], {});
    toast.success("Chat cleared");
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#F4F9FF] to-[#E8F3FF] dark:bg-black">
      <main className="w-full h-screen relative">
        
        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e3e3e3] dark:bg-black">
          <ChatHeader>
            <ChatHeaderBlock className="justify-start">
              <Avatar className="size-9 ring-2 ring-[#1a73e8]">
                <AvatarImage src="/logo.png" />
                <AvatarFallback>N</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-[18px] tracking-tight ml-2">
                NitiBot • Empowering India's Founder Story
              </p>
            </ChatHeaderBlock>

            <ChatHeaderBlock className="justify-end">
              <Button variant="outline" size="sm" onClick={clearChat}>
                Clear
              </Button>
            </ChatHeaderBlock>
          </ChatHeader>
        </div>

        {/* MAIN CHAT */}
        <div className="h-screen overflow-y-auto px-6 pt-[100px] pb-[160px]">
          <div className="flex flex-col justify-end min-h-full items-center">
            
            {/* INDIA Growth Banner (only if no messages except welcome) */}
            {messages.length <= 1 && (
              <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 shadow-md rounded-2xl p-6 mb-4 border">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="size-5 text-blue-600" />
                  Welcome to NitiBot — India’s Startup Policy Copilot
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Get instant clarity on DPIIT Recognition, Startup India benefits, SISFS funding, MSME/Udyam, BIRAC BIG, PRAYAS, TIDE 2.0, state startup policies, and everything powering the Indian innovation engine.
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    "Am I eligible for DPIIT?",
                    "Explain SISFS funding",
                    "Compare BIRAC vs PRAYAS",
                    "Checklist for Startup India registration",
                    "What’s new this month?"
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage({ text: q })}
                      className="px-4 py-2 text-xs rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isClient ? (
              <>
                <MessageWall
                  messages={messages}
                  status={status}
                  durations={durations}
                  onDurationChange={(k, d) => setDurations({ ...durations, [k]: d })}
                />
                {status === "submitted" && (
                  <Loader2 className="size-5 animate-spin text-muted-foreground mt-2" />
                )}
              </>
            ) : (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg dark:bg-black pb-4 pt-3 border-t border-[#e3e3e3]">
          <div className="flex justify-center w-full">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full max-w-3xl"
            >
              <FieldGroup>
                <Controller
                  name="message"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Ask anything about Startup India, MSME, policies, funding…"
                          className="h-14 rounded-full px-6 text-sm shadow-sm bg-white"
                        />

                        {status === "ready" || status === "error" ? (
                          <Button
                            type="submit"
                            disabled={!field.value.trim()}
                            className="absolute right-2 top-2 rounded-full h-10 w-10"
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => stop()}
                            className="absolute right-2 top-2 rounded-full h-10 w-10"
                          >
                            <Square className="size-4" />
                          </Button>
                        )}
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-neutral-500 mt-2">
            © {new Date().getFullYear()} {OWNER_NAME} • Built for India’s Growth • Powered by Ringel.AI
          </div>
        </div>
      </main>
    </div>
  );
}
