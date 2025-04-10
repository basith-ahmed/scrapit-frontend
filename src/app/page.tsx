"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Loader2, Send, Globe, Link2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


export default function ChatInterface() {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<
    { text: string; fromUser: boolean }[]
  >([]);
  const [query, setQuery] = useState("");
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages]);

  const handleStart = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/fetch-context?url=${encodeURIComponent(url)}&compress=true`
      );
      const data = await response.json();
      setContext(data.context);
      setStarted(true);
      setMessages([
        {
          text: `I've analyzed the content from [${url}](${url}). What would you like to know about it?`,
          fromUser: false,
        },
      ]);
    } catch (error) {
      console.error("Error fetching context:", error);
      setMessages([
        {
          text: "Sorry, I couldn't fetch information from that URL. Please try again.",
          fromUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchGeneratedContent(context: string, query: string) {
    const response = await fetch("/api/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, query }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch generated content");
    }

    const data = await response.json();
    return data.text;
  }

  const handleSendQuery = async () => {
    if (!query.trim() || isLoading) return;
    const userMessage = { text: query, fromUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);
    try {
      const text = await fetchGeneratedContent(context, query);
      setMessages((prev) => [...prev, { text, fromUser: false }]);
    } catch (error) {
      console.error("Gemini error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error. Please try again.",
          fromUser: false,
        },
      ]);
    } finally {
      inputRef.current?.focus();
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setContext("");
    setMessages([]);
    setQuery("");
    setStarted(false);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 transition-all duration-500 max-w-3xl mx-auto">
      {!started ? (
        <div className="flex flex-col items-center gap-6 p-8">
          <div className="text-4xl font-bold text-gray-800 mb-2">
            Chat with any website
          </div>
          <div className="text-gray-500 text-center max-w-md mb-4">
            Enter a URL and start asking questions about it.
          </div>
          <div className="flex justify-center items-center space-x-2">
            <div className="relative w-[30rem] max-w-md">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL"
                className="pl-10 py-6 text-base border-gray-200 focus:ring-2 focus:ring-blue-100 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={isLoading || !url.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-md transition-all duration-200 flex items-center gap-2 text-base w-[10rem]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Start Chat
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col max-w-3xl w-full mx-auto h-[90vh] border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="px-2 text-sm font-medium text-gray-900 flex items-center gap-1 truncate">
              <span>You are connected to:</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {url}
              </a>
              <Link2 className="text-blue-600 translate-y-0.5" size={15} />
            </div>
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-red-500 hover:text-red-700 text-sm px-2 border border-dashed border-red-100"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Clear Chat
            </Button>
          </div>

          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ scrollBehavior: "smooth" }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex",
                  msg.fromUser ? "justify-end" : "justify-start",
                  "animate-in fade-in duration-200"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl",
                    msg.fromUser
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none"
                  )}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages.length > 0 && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-none">
                  <div className="flex space-x-2">
                    <div
                      className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="mb-4">
              {/* <div className="text-xs text-gray-400 mb-1">Try asking:</div> */}
              <div className="flex flex-wrap gap-2 w-full">
                {[
                  "Give me a summary of this page",
                  "What is this page about?",
                  "List key points from this content",
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(sample)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-1.5 rounded-2xl text-xs transition-all border border-blue-100 flex-1"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Input
                type="text"
                value={query}
                ref={inputRef}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask something about this page..."
                className="flex-1 py-6 text-base border-gray-200 focus:ring-2 focus:ring-blue-100 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuery();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendQuery}
                disabled={isLoading || !query.trim()}
                className={cn(
                  "p-3 rounded-full aspect-square h-10 w-10 transition-all duration-200",
                  query.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
