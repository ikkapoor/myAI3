"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Sparkles, Square, Lightbulb } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";

import { AI_NAME, OWNER_NAME, WELCOME_MESSAGE } from "@/config";

const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-messages";

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef(false);

  const stored =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
      : { messages: [], durations: {} };

  const [initialMessages] = useState<UIMessage[]>(stored.messages || []);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  useEffect(() => {
    setIsClient(true);
    if (stored.messages) setMessages(stored.messages);
    if (stored.durations) setDurations(stored.durations);
  }, []);

  // Save to storage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, durations })
      );
    }
  }, [messages, durations, isClient]);

  // Welcome message
  useEffect(() => {
    if (isClient && initialMessages.length === 0 && !welcomeMessageShownRef.current) {
      const welcome: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      };
      setMessages([welcome]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: [welcome], durations: {} }));
      welcomeMessageShownRef.current = true;
    }
  }, [isClient]);

  // Chat submit
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    sendMessage({ text: data.message });
    form.reset();
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setDurations({});
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Chat cleared");
  };

  return (
    <div className="flex h-screen w-full justify-center bg-white dark:bg-black">
      <main className="w-full h-screen relative">

        {/* ===== HEADER ===== */}
        <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-black border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">

            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <Avatar className="size-10 ring-2 ring-[#FF671F]">
                <AvatarImage src="/logo.png" />
                <AvatarFallback>N</AvatarFallback>
              </Avatar>

              <div>
                <p className="font-semibold text-lg">
                  NitiBot — India’s Startup Policy Copilot
                </p>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  Built by Ishita Kapoor & Asmita Upadhaya
                </p>
              </div>
            </div>

            {/* Clear Chat */}
            <Button variant="outline" size="sm" onClick={clearChat}>
              Clear
            </Button>
          </div>
        </header>

        {/* ===== MAIN CHAT AREA ===== */}
        <section className="h-screen overflow-y-auto px-6 pt-[105px] pb-[160px] flex justify-center">
          <div className="w-full max-w-3xl">

            {/* ---- STARTUP INDIA SUGGESTIONS PANEL ---- */}
            {messages.length <= 1 && (
              <div className="bg-white shadow-sm border rounded-xl p-5 mb-5 dark:bg-neutral-900 dark:border-neutral-700">

                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="size-5 text-[#046A38]" />
                  Welcome to NitiBot
                </h2>

                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                  Your personal guide for Startup India, DPIIT recognition, SISFS funding,
                  MSME/Udyam, TIDE 2.0, PRAYAS, BIRAC BIG & state policies.
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    "Am I eligible for DPIIT recognition?",
                    "Explain SISFS seed funding",
                    "Checklist for Startup India registration",
                    "Compare PRAYAS vs BIRAC BIG",
                    "What’s new in January 2025?",
                    "Tell me benefits for women-led startups"
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage({ text: q })}
                      className="px-4 py-2 text-xs rounded-full bg-[#E6F2EE] text-[#046A38] hover:bg-[#D7EADF] transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- CHAT WALL ---- */}
            <MessageWall
              messages={messages}
              status={status}
              durations={durations}
              onDurationChange={(key, value) =>
                setDurations((prev) => ({ ...prev, [key]: value }))
              }
            />

            {status === "submitted" && (
              <div className="flex justify-start mt-2">
                <Loader2 className="size-5 animate-spin text-neutral-500" />
              </div>
            )}
          </div>
        </section>

        {/* ===== INPUT BAR ===== */}
        <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/85 dark:bg-black border-t border-neutral-200 py-4">
          <div className="w-full flex justify-center px-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-3xl">
              <FieldGroup>
                <Controller
                  name="message"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Ask anything about Startup India, MSME, SISFS, policies & funding…"
                          className="h-14 rounded-full px-6 text-sm shadow-sm"
                        />

                        {status === "ready" || status === "error" ? (
                          <Button
                            type="submit"
                            disabled={!field.value.trim()}
                            className="absolute right-2 top-2 h-10 w-10 rounded-full bg-[#046A38] hover:bg-[#034F29]"
                          >
                            <ArrowUp className="size-4 text-white" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => stop()}
                            className="absolute right-2 top-2 h-10 w-10 rounded-full bg-red-500"
                          >
                            <Square className="size-4 text-white" />
                          </Button>
                        )}
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>

          <p className="text-center text-xs text-neutral-500 mt-1">
            © {new Date().getFullYear()} {OWNER_NAME} • Built for India’s Startup Growth Journey
          </p>
        </footer>
      </main>
    </div>
  );
}
