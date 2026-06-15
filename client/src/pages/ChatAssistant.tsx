import { useState, useRef, useEffect } from "react";
import { useCategory } from "@/contexts/CategoryContext";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Send, BarChart3, Search, Target, Compass, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AgentLoadingAnimation from "@/components/AgentLoadingAnimation";
import { PageTransition } from "@/components/animations";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentType?: string;
  agentName?: string;
  timestamp: Date;
}

interface AnalysisModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgActive: string;
  borderActive: string;
  shadowActive: string;
}

const ANALYSIS_MODULES: AnalysisModule[] = [
  {
    id: "statistics",
    name: "ניתוח סטטיסטי",
    description: "נתונים, ממוצעים, ומגמות מ-1990",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "#1F6BFF",
    bgActive: "rgba(31,107,255,0.10)",
    borderActive: "rgba(31,107,255,0.40)",
    shadowActive: "0 0 12px rgba(31,107,255,0.18)",
  },
  {
    id: "research",
    name: "מחקר ליגה",
    description: "מידע עדכני על קבוצות ושחקנים",
    icon: <Search className="w-4 h-4" />,
    color: "#8B4DFF",
    bgActive: "rgba(139,77,255,0.10)",
    borderActive: "rgba(139,77,255,0.40)",
    shadowActive: "0 0 12px rgba(139,77,255,0.18)",
  },
  {
    id: "prediction",
    name: "מנוע חיזוי",
    description: "חיזויים מבוססי נתונים היסטוריים",
    icon: <Target className="w-4 h-4" />,
    color: "#1F6BFF",
    bgActive: "rgba(31,107,255,0.10)",
    borderActive: "rgba(31,107,255,0.40)",
    shadowActive: "0 0 12px rgba(31,107,255,0.18)",
  },
  {
    id: "tactical",
    name: "ניתוח טקטי",
    description: "סגנון משחק, הרכבים, ותכסיסים",
    icon: <Compass className="w-4 h-4" />,
    color: "#8B4DFF",
    bgActive: "rgba(139,77,255,0.10)",
    borderActive: "rgba(139,77,255,0.40)",
    shadowActive: "0 0 12px rgba(139,77,255,0.18)",
  },
];

export default function ChatAssistant() {
  const { setCategory } = useCategory();
  useEffect(() => { setCategory("ai"); }, [setCategory]);
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "שלום! ברוך הבא למערכת הניתוח המקצועית.\n\nבחר מודול ניתוח ושאל כל שאלה על הכדורגל הישראלי — נתונים מ-1990 ועד היום, סטטיסטיקות, פורמה, מגמות, ועוד.\n\n**דוגמאות לשאלות:**\n- מה הפורמה של מכבי חיפה ב-5 המשחקים האחרונים?\n- מה הסטטיסטיקה של ביתר ירושלים בבית?\n- ניתוח טקטי של הפועל באר שבע",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const agentQueryMutation = trpc.agents.query.useMutation({
    onSuccess: (data: any) => {
      const module = ANALYSIS_MODULES.find((m) => m.id === data.agentType);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          agentType: data.agentType,
          agentName: module?.name,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(`שגיאה: ${error.message}`);
      setIsLoading(false);
    },
  });

  const multiAgentQueryMutation = trpc.agents.queryAll.useMutation({
    onSuccess: (data: any) => {
      const combined = `## ניתוח מקיף:\n\n### 📊 ניתוח סטטיסטי\n${data.responses.statistics.response}\n\n---\n\n### 🔍 מחקר ליגה\n${data.responses.research.response}\n\n---\n\n### 🎯 מנוע חיזוי\n${data.responses.prediction.response}\n\n---\n\n### 🧭 ניתוח טקטי\n${data.responses.tactical.response}`;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: combined,
          agentType: "multi",
          agentName: "ניתוח מקיף",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(`שגיאה: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: inputValue, timestamp: new Date() },
    ]);
    setInputValue("");
    setIsLoading(true);

    if (selectedModule === "all") {
      multiAgentQueryMutation.mutate({ message: inputValue });
    } else {
      agentQueryMutation.mutate({ agentType: (selectedModule || "prediction") as any, message: inputValue });
    }
  };

  /* ── Unauthenticated ── */
  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background text-foreground">
          <Navigation />
          <main className="max-w-3xl mx-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="text-center mb-10"
            >
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #9D6FFF, #8B4DFF)", boxShadow: "0 8px 28px rgba(139,77,255,0.35)" }}>
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-black text-gradient-blue mb-2">מערכת ניתוח מקצועית</h1>
              <p className="text-muted-foreground">נתונים מ-1990 ועד היום • ליגת העל וליגה לאומית</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {ANALYSIS_MODULES.map((module, i) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    className="w-full text-right"
                    onClick={() => { window.location.href = getLoginUrl(); }}
                  >
                    <Card
                      className="p-4 transition-all duration-200 cursor-pointer"
                      style={{ borderColor: "transparent" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = module.borderActive; (e.currentTarget as HTMLElement).style.boxShadow = module.shadowActive; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: module.bgActive }}>
                          <span style={{ color: module.color }}>{module.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        </div>
                        <span className="text-[10px] font-bold shrink-0" style={{ color: module.color }}>התחבר →</span>
                      </div>
                    </Card>
                  </button>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-4">התחבר כדי לשאול שאלות ולקבל ניתוחים מקצועיים</p>
              <Button variant="accent" size="lg" className="gap-2 font-bold px-8"
                onClick={() => { window.location.href = getLoginUrl(); }}>
                <Sparkles className="w-4 h-4" />
                התחבר עכשיו
              </Button>
            </motion.div>
          </main>
        </div>
      </PageTransition>
    );
  }

  /* ── Authenticated ── */
  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navigation />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <h1 className="text-3xl font-black text-gradient-blue">מערכת ניתוח מקצועית</h1>
            <p className="text-sm text-muted-foreground mt-0.5">נתונים מ-1990 ועד היום • ליגת העל וליגה לאומית</p>
          </motion.div>

          {/* Module selector */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-2"
          >
            {ANALYSIS_MODULES.map((module) => {
              const active = selectedModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(active ? null : module.id)}
                  className="p-3 rounded-xl border text-right transition-all duration-200"
                  style={
                    active
                      ? { background: module.bgActive, borderColor: module.borderActive, boxShadow: module.shadowActive }
                      : { borderColor: "var(--border)", background: "var(--card)", opacity: 0.85 }
                  }
                >
                  <div className="mb-1.5" style={{ color: active ? module.color : "var(--muted-foreground)" }}>
                    {module.icon}
                  </div>
                  <p className="font-bold text-xs" style={{ color: active ? module.color : "var(--foreground)" }}>{module.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{module.description}</p>
                </button>
              );
            })}

            {/* All modules */}
            {(() => {
              const active = selectedModule === "all";
              return (
                <button
                  onClick={() => setSelectedModule(active ? null : "all")}
                  className="p-3 rounded-xl border text-right transition-all duration-200"
                  style={
                    active
                      ? { background: "rgba(139,77,255,0.10)", borderColor: "rgba(139,77,255,0.40)", boxShadow: "0 0 12px rgba(139,77,255,0.18)" }
                      : { borderColor: "var(--border)", background: "var(--card)", opacity: 0.85 }
                  }
                >
                  <div className="mb-1.5" style={{ color: active ? "#8B4DFF" : "var(--muted-foreground)" }}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-xs" style={{ color: active ? "#8B4DFF" : "var(--foreground)" }}>ניתוח מקיף</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">כל המודולים ביחד</p>
                </button>
              );
            })()}
          </motion.div>

          {/* Chat box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="flex-1"
          >
            <Card className="flex flex-col border-border/20 h-[520px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] lg:max-w-[70%] px-4 py-3 rounded-2xl text-sm ${
                        message.role === "user"
                          ? "text-white rounded-tr-sm"
                          : "bg-muted/20 border border-border/20 text-foreground rounded-tl-sm"
                      }`}
                      style={message.role === "user"
                        ? { background: "linear-gradient(135deg, #4D8FFF, #1F6BFF)" }
                        : {}}
                    >
                      {message.agentName && message.role === "assistant" && (
                        <p className="text-xs font-bold mb-1.5" style={{ color: "#1F6BFF" }}>
                          {message.agentName}
                        </p>
                      )}
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none text-foreground [&_strong]:text-foreground [&_h3]:text-foreground [&_h2]:text-foreground [&_li]:text-foreground [&_p]:text-foreground">
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      <p className={`text-[10px] mt-1.5 ${message.role === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                        {message.timestamp.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <AgentLoadingAnimation
                    agentType={selectedModule || "prediction"}
                    agentIcon={undefined}
                    agentName={
                      selectedModule === "all"
                        ? "ניתוח מקיף"
                        : ANALYSIS_MODULES.find((m) => m.id === selectedModule)?.name
                    }
                    isLoading={isLoading}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border/20 bg-muted/5">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                    }}
                    placeholder={selectedModule ? "שאל על הכדורגל הישראלי..." : "בחר מודול ושאל שאלה..."}
                    disabled={isLoading}
                    className="flex-1 border-border/25 bg-background/80"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    variant="accent"
                    className="px-4 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
