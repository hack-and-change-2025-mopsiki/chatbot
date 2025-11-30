"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useStreamChat } from "@/src/hooks/useStreamChat";
import { marked } from "marked";

interface Message {
  id: string;
  type: "user" | "assistant";
  text: string;
}

interface ChatHistoryItem {
  id: number;
  title: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(
    localStorage.getItem("messages")
      ? JSON.parse(localStorage.getItem("messages") as string)
      : [
          {
            id: "1",
            type: "assistant",
            text: "Привет! Как можем помочь?",
          },
        ]
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isDataCollectionOpen, setIsDataCollectionOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isCollectLoading, setIsCollectLoading] = useState(false);
  const [isInferrenceFired, setIsInferrenceFired] = useState(false);
  const { sendMessage } = useStreamChat({
    onChunk: (chunk) => {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.type === "assistant") {
          const updatedMessage: Message = {
            ...lastMessage,
            text: lastMessage.text + chunk,
          };
          return [...prevMessages.slice(0, -1), updatedMessage];
        }
        return prevMessages;
      });
    },
    onComplete: () => {
      setIsInferrenceFired(false);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
      setIsInferrenceFired(false);
    },
  });

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const [chatHistory] = useState<ChatHistoryItem[]>([
    { id: 1, title: "Что такое мопсики agi?" },
  ]);

  const platforms = ["VC", "Хабр", "Телеграм"];

  const suggestedQuestions = [
    "Что такое мопсики agi?",
    "Самый крутой пост за последнее время",
    "На какую тему мне сделать пост?",
    "Как читатели относятся к Kubernetes?",
  ];

  const handleSend = () => {
    if (inputValue.trim()) {
      setIsInferrenceFired(true);
      try {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          type: "user",
          text: inputValue,
        };
        setMessages([...messages, newMessage]);
        setInputValue("");

        const agiMessageId = crypto.randomUUID();
        const assistantMessage: Message = {
          id: agiMessageId,
          type: "assistant",
          text: "",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        sendMessage([
          ...messages.map((msg) => ({
            role: (msg.type === "user" ? "user" : "assistant") as
              | "user"
              | "assistant",
            content: msg.text,
          })),
          { role: "user", content: inputValue },
        ]);
      } finally {
        setIsInferrenceFired(false);
      }
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const selectAllPlatforms = () => {
    if (selectedPlatforms.length === platforms.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(platforms);
    }
  };

  const handleCollectData = async () => {
    try {
      setIsCollectLoading(true);
      // Логика сбора данных
      const response = await fetch(process.env.COLLECTOR_API_URL!, {
        method: "POST",
        body: JSON.stringify({
          platforms: selectedPlatforms,
        }),
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
      });

      if (response.ok) {
        toast.success("Ураа сбор прошёл!");
      } else {
        toast.error((await response.json()).message);
      }

      setIsDataCollectionOpen(false);
    } finally {
      setIsCollectLoading(false);
    }
  };

  const closeDataCollection = () => {
    setIsDataCollectionOpen(false);
  };

  return (
    <div
      className="w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex relative backdrop-blur-xl bg-white/30 border border-white/40"
      style={{ height: "600px" }}
    >
      <div className="w-64 p-6 flex flex-col relative backdrop-blur-xl bg-linear-to-br from-purple-200/60 to-pink-200/60 border-r border-white/30">
        <div className="absolute inset-0 bg-linear-to-br from-purple-300/20 via-pink-300/20 to-blue-300/20 backdrop-blur-sm" />

        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600 text-2xl mb-2">
              мопсики agi
            </h1>
            <p className="text-purple-700/80 text-sm">Ассистент для таблиц</p>
          </div>

          <div className="flex-1 overflow-y-auto mb-6">
            <h3 className="text-purple-600/80 text-sm mb-3">Чат хистори</h3>
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    toast.warning("Сюда нельзя!!!");
                  }}
                  className="backdrop-blur-md bg-white/40 rounded-xl p-3 cursor-not-allowed hover:bg-white/60 transition-all border border-white/50 shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-linear-to-r from-blue-400 to-cyan-400 rounded-full mt-1.5 shrink-0 shadow-lg shadow-blue-300/50" />
                    <p className="text-gray-700 text-sm">{chat.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              toast.warning("Сюда нельзя!!!");
            }}
            className="w-full backdrop-blur-xl bg-linear-to-br from-pink-200/40 via-blue-200/40 to-green-200/40 rounded-xl py-3 px-4 hover:from-pink-200/60 hover:via-blue-200/60 hover:to-green-200/60 hover:shadow-2xl hover:shadow-purple-300/50 transition-all border border-white/60 shadow-xl"
          >
            <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-600 via-purple-600 to-emerald-600">
              Новый чат
            </span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 backdrop-blur-xl border shadow-xl [&>ul]:list-disc [&>ul]:pl-4 *:pb-2 ${
                    message.type === "user"
                      ? "bg-linear-to-r from-pink-300/70 to-red-300/70 text-gray-800 border-pink-200/50 shadow-pink-200/50"
                      : "bg-linear-to-r from-blue-200/70 to-cyan-200/70 text-gray-800 border-blue-200/50 shadow-blue-200/50"
                  } `}
                  dangerouslySetInnerHTML={{
                    __html: marked(message.text, { async: false }),
                  }}
                />
              </div>
            ))}

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div className="mt-12">
                <p className="text-gray-600 text-center mb-4">
                  Я предлагаю спросить это:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedQuestions.map((question, index) => {
                    const gradients = [
                      "from-pink-200/70 to-red-200/70 border-pink-300/50 hover:from-pink-300/80 hover:to-red-300/80 text-pink-700",
                      "from-blue-200/70 to-cyan-200/70 border-blue-300/50 hover:from-blue-300/80 hover:to-cyan-300/80 text-blue-700",
                      "from-purple-200/70 to-pink-200/70 border-purple-300/50 hover:from-purple-300/80 hover:to-pink-300/80 text-purple-700",
                      "from-green-200/70 to-emerald-200/70 border-green-300/50 hover:from-green-300/80 hover:to-emerald-300/80 text-green-700",
                    ];
                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(question)}
                        className={`backdrop-blur-md bg-linear-to-r ${gradients[index]} border-2 rounded-xl p-4 transition-all shadow-lg`}
                      >
                        {question}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/40 p-6 backdrop-blur-lg bg-white/20">
          <div className="max-w-3xl mx-auto relative">
            <div className="flex gap-4 items-center backdrop-blur-xl bg-white/50 rounded-2xl px-6 py-4 border-2 border-white/60 focus-within:border-purple-300 focus-within:shadow-lg focus-within:shadow-purple-200/50 transition-all shadow-xl">
              {/* Data Collection Button */}
              <button
                onClick={() => setIsDataCollectionOpen(!isDataCollectionOpen)}
                className="bg-linear-to-r from-green-300/70 to-emerald-300/70 text-green-700 rounded-xl p-2.5 hover:from-green-400/80 hover:to-emerald-400/80 transition-all shadow-lg shadow-green-200/50 backdrop-blur-sm border border-green-200/50"
                title="Собрать данные"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M12 12v7" />
                </svg>
              </button>

              <input
                type="text"
                value={inputValue}
                disabled={isInferrenceFired}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Напишите сюда крутой вопрос..."
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500"
              />

              <button
                onClick={handleSend}
                disabled={isInferrenceFired}
                className="bg-linear-to-r from-purple-400 to-pink-400 text-white rounded-xl p-3 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-300/50 backdrop-blur-sm"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* Data Collection Modal */}
            {isDataCollectionOpen && (
              <div className="absolute bottom-full mb-3 left-6 backdrop-blur-xl bg-white/90 rounded-2xl p-5 border-2 border-white/70 shadow-2xl w-72">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
                    Сбор данных
                  </h3>
                  <button
                    onClick={closeDataCollection}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  Выберите платформы:
                </p>

                <div className="space-y-2 mb-4">
                  {platforms.map((platform, index) => {
                    const gradients = [
                      {
                        bg: "peer-checked:from-pink-300/70 peer-checked:via-rose-300/70 peer-checked:to-pink-400/70",
                        border: "peer-checked:border-pink-400/60",
                        shadow: "peer-checked:shadow-pink-300/40",
                      },
                      {
                        bg: "peer-checked:from-purple-300/70 peer-checked:via-violet-300/70 peer-checked:to-purple-400/70",
                        border: "peer-checked:border-purple-400/60",
                        shadow: "peer-checked:shadow-purple-300/40",
                      },
                      {
                        bg: "peer-checked:from-orange-300/70 peer-checked:via-amber-300/70 peer-checked:to-orange-400/70",
                        border: "peer-checked:border-orange-400/60",
                        shadow: "peer-checked:shadow-orange-300/40",
                      },
                    ];
                    const gradient = gradients[index];
                    return (
                      <label
                        key={platform}
                        className="flex items-center gap-3 cursor-pointer backdrop-blur-md bg-white/40 rounded-xl p-2.5 border border-white/50 hover:bg-white/60 transition-all"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform)}
                            onChange={() => togglePlatform(platform)}
                            className="sr-only peer"
                          />
                          <div
                            className={`w-4 h-4 rounded-full backdrop-blur-lg bg-white/50 border-2 border-purple-200/50 peer-checked:bg-linear-to-br ${gradient.bg} ${gradient.border} transition-all duration-300 shadow-sm peer-checked:shadow-lg ${gradient.shadow} flex items-center justify-center`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300 shadow-sm" />
                          </div>
                        </div>
                        <span className="text-gray-700 text-sm">
                          {platform}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleCollectData}
                    disabled={isCollectLoading}
                    className="w-full cursor-pointer backdrop-blur-md bg-linear-to-r from-green-200/80 to-emerald-200/80 text-green-700 rounded-xl py-2 px-3 text-sm hover:from-green-300/90 hover:to-emerald-300/90 transition-all border border-green-200/50 shadow-lg"
                  >
                    Провести сбор
                  </Button>
                  <button
                    onClick={selectAllPlatforms}
                    className="w-full backdrop-blur-md bg-linear-to-r from-purple-200/70 to-pink-200/70 text-purple-700 rounded-xl py-1.5 px-3 text-sm hover:from-purple-300/80 hover:to-pink-300/80 transition-all border border-purple-200/50 shadow-lg"
                  >
                    Выбрать всё
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
