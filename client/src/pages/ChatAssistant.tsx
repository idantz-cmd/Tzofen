import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Send, BarChart3, Search, Target, Compass } from "lucide-react";
import { toast } from "sonner";
import AgentLoadingAnimation from "@/components/AgentLoadingAnimation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentType?: string;
  agentName?: string;
  agentIcon?: string;
  timestamp: Date;
}

interface AnalysisModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const ANALYSIS_MODULES: AnalysisModule[] = [
  {
    id: "statistics",
    name: "ניתוח סטטיסטי",
    description: "נתונים, ממוצעים, ומגמות מ-1990",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "research",
    name: "מחקר ליגה",
    description: "מידע עדכני על קבוצות ושחקנים",
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: "prediction",
    name: "מנוע חיזוי",
    description: "חיזויים מבוססי נתונים היסטוריים",
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: "tactical",
    name: "ניתוח טקטי",
    description: "סגנון משחק, הרכבים, ותכסיסים",
    icon: <Compass className="w-5 h-5" />,
  },
];

export default function ChatAssistant() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "שלום! 👋 ברוך הבא למערכת הניתוח המקצועית.\n\nבחר מודול ניתוח ושאל כל שאלה על הכדורגל הישראלי — נתונים מ-1990 ועד היום, סטטיסטיקות, פורמה, מגמות, ועוד.\n\n**דוגמאות לשאלות:**\n- מה הפורמה של מכבי חיפה ב-5 המשחקים האחרונים?\n- מה הסטטיסטיקה של ביתר ירושלים בבית?\n- ניתוח טקטי של הפועל באר שבע",
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

  // Single module query mutation
  const agentQueryMutation = trpc.agents.query.useMutation({
    onSuccess: (data: any) => {
      const module = ANALYSIS_MODULES.find((m) => m.id === data.agentType);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        agentType: data.agentType,
        agentName: module?.name,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(`שגיאה: ${error.message}`);
      setIsLoading(false);
    },
  });

  // Multi-module query mutation
  const multiAgentQueryMutation = trpc.agents.queryAll.useMutation({
    onSuccess: (data: any) => {
      const combinedContent = `## ניתוח מקיף:

### 📊 ניתוח סטטיסטי
${data.responses.statistics.response}

---

### 🔍 מחקר ליגה
${data.responses.research.response}

---

### 🎯 מנוע חיזוי
${data.responses.prediction.response}

---

### 🧭 ניתוח טקטי
${data.responses.tactical.response}
`;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: combinedContent,
        agentType: "multi",
        agentName: "ניתוח מקיף",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(`שגיאה: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (selectedModule === "all") {
      multiAgentQueryMutation.mutate({ message: inputValue });
    } else if (selectedModule) {
      agentQueryMutation.mutate({
        agentType: selectedModule as any,
        message: inputValue,
      });
    } else {
      // Default to prediction module
      agentQueryMutation.mutate({
        agentType: "prediction" as any,
        message: inputValue,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <BarChart3 className="w-12 h-12 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-black mb-2">מערכת ניתוח מקצועית</h1>
            <p className="text-muted-foreground">נתונים מ-1990 ועד היום • ליגת העל וליגה לאומית</p>
          </div>

          {/* Show available modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {ANALYSIS_MODULES.map((module) => (
              <Card key={module.id} className="p-4 border-border/30">
                <div className="flex items-center gap-3">
                  <div className="text-primary">{module.icon}</div>
                  <div>
                    <p className="font-bold text-foreground">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Login CTA */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">התחבר כדי לשאול שאלות ולקבל ניתוחים מקצועיים</p>
            <Button
              variant="accent"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              התחבר עכשיו
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-foreground">מערכת ניתוח מקצועית</h1>
          <p className="text-sm text-muted-foreground">נתונים מ-1990 ועד היום • ליגת העל וליגה לאומית</p>
        </div>

        {/* Module Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ANALYSIS_MODULES.map((module) => (
            <button
              key={module.id}
              onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
              className={`p-3 rounded-lg border text-right transition-all duration-200 ${
                selectedModule === module.id
                  ? "border-primary bg-primary/10 shadow-[0_0_8px_oklch(0.55_0.110_232_/_0.20)]"
                  : "border-border/30 hover:border-primary/40 bg-card/50"
              }`}
            >
              <div className={`mb-1 ${selectedModule === module.id ? "text-primary" : "text-muted-foreground"}`}>
                {module.icon}
              </div>
              <h3 className="font-bold text-xs">{module.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{module.description}</p>
            </button>
          ))}

          {/* All Modules */}
          <button
            onClick={() => setSelectedModule(selectedModule === "all" ? null : "all")}
            className={`p-3 rounded-lg border text-right transition-all duration-200 ${
              selectedModule === "all"
                ? "border-primary bg-primary/10 shadow-[0_0_8px_oklch(0.55_0.110_232_/_0.20)]"
                : "border-border/30 hover:border-primary/40 bg-card/50"
            }`}
          >
            <div className={`mb-1 ${selectedModule === "all" ? "text-primary" : "text-muted-foreground"}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs">ניתוח מקיף</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">כל המודולים ביחד</p>
          </button>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col border-border/30 max-h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[70%] px-4 py-3 rounded-lg ${
                    message.role === "user"
                      ? "text-white"
                      : "bg-muted/20 border border-border/20 text-foreground"
                  }`}
                  style={message.role === "user" ? { background: "oklch(0.45 0.085 232)" } : {}}
                >
                  {message.agentName && message.role === "assistant" && (
                    <div className="text-xs font-bold text-primary mb-2">
                      {message.agentName}
                    </div>
                  )}
                  {message.role === "assistant" ? (
                    <div className="text-sm prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p className={`text-[10px] mt-2 ${
                    message.role === "user" ? "text-white/60" : "text-muted-foreground"
                  }`}>
                    {message.timestamp.toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading Animation */}
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
          <div className="px-4 py-3 border-t border-border/20">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  selectedModule
                    ? `שאל על הכדורגל הישראלי...`
                    : "בחר מודול ניתוח ושאל שאלה..."
                }
                disabled={isLoading}
                className="flex-1 bg-muted/10 border-border/30"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                variant="accent"
                className="px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
