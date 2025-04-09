"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

const IndexPage = () => {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<
    { text: string; fromUser: boolean }[]
  >([]);
  const [query, setQuery] = useState("");
  const [started, setStarted] = useState(false);

  const handleStart = async () => {
    try {
      const response = await fetch(
        `/api/fetch-context?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      console.log(data)
      setContext(data.context);
      setStarted(true);
    } catch (error) {
      console.error("Error fetching context:", error);
    }
  };

  const handleSendQuery = async () => {
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { text: query, fromUser: true }]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent([
        `Context: ${context}\nUser: ${query}`,
      ]);
      const response = result.response;
      const text = response.text();
      setMessages((prev) => [...prev, { text, fromUser: false }]);
    } catch (error) {
      console.error("Gemini error:", error);
    }

    setQuery("");
  };

  return (
    <div className="text-black flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 transition-all duration-700">
      {!started ? (
        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            className="border border-gray-300 rounded px-4 py-2 w-80"
          />
          <button
            onClick={handleStart}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Start
          </button>
        </div>
      ) : (
        <div className="flex flex-col w-full max-w-2xl h-[90vh]">
          <div className="text-sm text-gray-500 mb-2 px-2 text-center">
            Context loaded. Chat below.
          </div>
          <div className="flex-1 overflow-y-auto bg-white rounded p-4 space-y-4 shadow">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[75%] px-4 py-2 rounded-lg ${
                  msg.fromUser
                    ? "bg-blue-500 text-white self-end"
                    : "bg-gray-200 text-black self-start"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 border border-gray-300 rounded px-4 py-2"
              onKeyDown={(e) => e.key === "Enter" && handleSendQuery()}
            />
            <button
              onClick={handleSendQuery}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexPage;
