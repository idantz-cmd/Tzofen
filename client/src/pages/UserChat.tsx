import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "@/components/Navigation";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, MessageSquare, Users, ArrowRight, UserPlus } from "lucide-react";

export default function UserChat() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: conversations = [], isLoading: convsLoading } = trpc.userChat.getConversations.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000, // poll every 10s
  });

  const { data: messagesData, isLoading: msgsLoading } = trpc.userChat.getMessages.useQuery(
    { userId: selectedUserId! },
    { enabled: isAuthenticated && !!selectedUserId, refetchInterval: 5000 }
  );

  const { data: availableUsers = [] } = trpc.userChat.getAvailableUsers.useQuery(undefined, {
    enabled: isAuthenticated && showNewChat,
  });

  const { data: unreadCount = 0 } = trpc.userChat.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  // Mutations
  const sendMutation = trpc.userChat.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.userChat.getMessages.invalidate({ userId: selectedUserId! });
      utils.userChat.getConversations.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בשליחת ההודעה");
    },
  });

  const messages = useMemo(() => messagesData?.messages || [], [messagesData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <MessageSquare className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-3">צ'אט</h1>
          <p className="text-muted-foreground mb-6">התחבר כדי לדבר עם מתחרים אחרים</p>
          <Button
            variant="accent"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            התחבר עכשיו
          </Button>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!newMessage.trim() || !selectedUserId) return;
    sendMutation.mutate({
      receiverId: selectedUserId,
      content: newMessage.trim(),
    });
  };

  const handleStartChat = (userId: number) => {
    setSelectedUserId(userId);
    setShowNewChat(false);
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  const selectedConversation = conversations.find((c: any) => c.userId === selectedUserId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 h-[calc(100vh-140px)]">
          {/* Conversations Sidebar */}
          <Card className="w-72 shrink-0 border-border/30 flex flex-col hidden md:flex">
            <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-sm">שיחות</h2>
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-white text-[10px] px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewChat(!showNewChat)}
                className="text-primary hover:text-primary/80"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* New Chat - User List */}
            {showNewChat && (
              <div className="px-3 py-2 border-b border-border/20 max-h-48 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2 font-bold">שיחה חדשה:</p>
                {availableUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">אין משתמשים זמינים</p>
                ) : (
                  availableUsers.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartChat(u.id)}
                      className="w-full text-right px-3 py-2 rounded-lg text-sm hover:bg-muted/20 transition-colors"
                    >
                      {u.name || "משתמש"}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {convsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner className="w-5 h-5" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">אין שיחות עדיין</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">לחץ + כדי להתחיל שיחה</p>
                </div>
              ) : (
                conversations.map((conv: any) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUserId(conv.userId)}
                    className={`w-full text-right px-4 py-3 border-b border-border/10 transition-colors ${
                      selectedUserId === conv.userId
                        ? "bg-primary/10 border-r-2 border-r-primary"
                        : "hover:bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{conv.userName}</span>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-white text-[10px] px-1.5 py-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                      {conv.lastMessage || "..."}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {formatTime(conv.lastMessageAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 border-border/30 flex flex-col">
            {!selectedUserId ? (
              /* No conversation selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold">בחר שיחה</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    בחר שיחה מהרשימה או התחל שיחה חדשה
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => setSelectedUserId(null)}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {(selectedConversation?.userName || "מ")[0]}
                      </span>
                    </div>
                    <span className="font-bold">
                      {selectedConversation?.userName || "משתמש"}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgsLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground text-sm">אין הודעות עדיין. שלח הודעה ראשונה!</p>
                    </div>
                  ) : (
                    messages.map((msg: any, i: number) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          className={`flex ${isOwn ? "justify-start" : "justify-end"}`}
                        >
                          <div className={`max-w-[75%]`}>
                            <div className={`px-3 py-2 rounded-lg text-sm ${
                              isOwn
                                ? "bg-primary/10 border border-primary/20 text-foreground"
                                : "bg-muted/20 border border-border/20 text-foreground"
                            }`}>
                              {msg.message}
                            </div>
                            <p className={`text-[10px] text-muted-foreground/60 mt-0.5 ${isOwn ? "text-right" : "text-left"}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-border/20">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="כתוב הודעה..."
                      className="bg-muted/10 border-border/30"
                      disabled={sendMutation.isPending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sendMutation.isPending}
                      variant="accent"
                      className="px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
