import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, X, Loader2, Minimize2, Maximize2, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface OtherUser {
  firstName: string;
  lastName: string;
  businessName: string | null;
  role: string;
  avatarUrl?: string | null;
}

interface Conversation {
  conversationId: string;
  conversationType: "trade" | "standalone";
  otherUserId: string;
  otherUser: OtherUser;
  lastMessage: { content: string; createdAt: string };
  unread: boolean;
}

interface SearchUser {
  id: string;
  phone: string;
  email: string | null;
  role: string;
  firstName: string;
  lastName: string;
  businessName: string | null;
  avatarUrl: string | null;
}

export function ChatWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery<{ data: Conversation[] }>({
    queryKey: ["chat-conversations"],
    queryFn: () => customFetch("/api/v1/messages/conversations"),
    enabled: isOpen,
    refetchInterval: 5000,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery<{ data: SearchUser[] }>({
    queryKey: ["chat-search", searchQuery],
    queryFn: () => customFetch(`/api/v1/conversations/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: showNewChat && searchQuery.length >= 1,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const [wsMessages, setWsMessages] = useState<Message[]>([]);

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ["chat", selectedChatId],
    queryFn: () => customFetch(`/api/v1/messages/${selectedChatId}`),
    enabled: !!selectedChatId,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedChatId) return;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "message",
          tradeId: selectedChatId,
          content,
          messageType: "TEXT",
        }));
        return;
      }
      return customFetch(`/api/v1/messages/${selectedChatId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      setMessage("");
      if (selectedChatId) {
        queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      }
    },
    onError: () => console.error("Failed to send message"),
  });

  const createConversationMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const res = await customFetch("/api/v1/conversations", {
        method: "POST",
        body: JSON.stringify({ participantId }),
      });
      return res;
    },
    onSuccess: (data: any) => {
      setSelectedChatId(data.id || data.conversationId);
      setShowNewChat(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      toast({ title: "Conversation started" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create conversation", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("Chat WS connected");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "message") {
          setWsMessages(prev => [...prev, msg.message]);
          queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };
    ws.onerror = (err) => console.error("Chat WS error", err);
    ws.onclose = () => { wsRef.current = null; };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [isOpen, queryClient]);

  useEffect(() => {
    if (!wsRef.current || !selectedChatId) return;
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "join", tradeId: selectedChatId }));
    } else {
      wsRef.current.onopen = () => {
        wsRef.current?.send(JSON.stringify({ type: "join", tradeId: selectedChatId }));
      };
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      customFetch(`/api/v1/messages/${selectedChatId}/read`, { method: "PATCH" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["chat-conversations"] }))
        .catch(() => {});
    }
  }, [selectedChatId, queryClient]);

  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData, wsMessages, isOpen, isMinimized]);

  useEffect(() => {
    if (showNewChat && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showNewChat]);

  const conversations = conversationsData?.data ?? [];
  const historyMessages: Message[] = messagesData?.messages ?? [];
  const messages = [...historyMessages, ...wsMessages];
  const unreadCount = conversations.filter(c => c.unread).length;

  const selectedConv = conversations.find(c => c.conversationId === selectedChatId);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-6 w-6 flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] flex flex-col shadow-2xl rounded-xl overflow-hidden bg-background border border-border">
          <Card className="rounded-none border-0 border-b border-border">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {showNewChat ? "New Conversation" : selectedChatId && selectedConv
                  ? (selectedConv.otherUser.businessName ?? `${selectedConv.otherUser.firstName} ${selectedConv.otherUser.lastName}`)
                  : "Messages"}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedChatId && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedChatId(null)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {showNewChat && (
                  <Button variant="ghost" size="icon" onClick={() => { setShowNewChat(false); setSearchQuery(""); }} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8">
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {!isMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {showNewChat ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search users by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {searchQuery.length < 1 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Type at least 1 character to search</p>
                    ) : searchLoading ? (
                      <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
                    ) : !searchData?.data?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
                    ) : (
                      searchData.data.map((su) => {
                        const name = su.businessName || `${su.firstName} ${su.lastName}`;
                        return (
                          <div
                            key={su.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => createConversationMutation.mutate(su.id)}
                          >
                            {su.avatarUrl ? (
                              <img src={su.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{name}</p>
                              <p className="text-xs text-muted-foreground truncate">{su.role} {su.phone ? `• ${su.phone}` : ""}</p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : !selectedChatId ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-border flex gap-1">
                    <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => setShowNewChat(true)}>
                      <Plus className="h-3.5 w-3.5" /> New Chat
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {conversationsLoading ? (
                      <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
                    ) : conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">No conversations yet</p>
                        <Button variant="link" size="sm" onClick={() => setShowNewChat(true)}>Start a new chat</Button>
                      </div>
                    ) : (
                      conversations.map((conv) => {
                        const name = conv.otherUser.businessName ?? `${conv.otherUser.firstName} ${conv.otherUser.lastName}`;
                        return (
                          <Card
                            key={conv.conversationId}
                            className={`cursor-pointer hover:border-primary/40 transition-colors ${conv.unread ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                            onClick={() => setSelectedChatId(conv.conversationId)}
                          >
                            <CardContent className="flex items-center gap-3 p-3">
                              {conv.otherUser.avatarUrl ? (
                                <img src={conv.otherUser.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                                  {(name[0] ?? "?").toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-sm truncate text-foreground">{name}</p>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {conv.unread && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage.content}</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`h-16 bg-muted rounded-lg animate-pulse ${i % 2 === 0 ? "ml-auto w-3/4" : "w-3/4"}`} />
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <p className="text-muted-foreground">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isCurrentUser = user?.id && msg.senderId === user.id;
                        return (
                          <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendMutation.mutate(message.trim()); }}
                    className="flex items-center gap-2 p-3 border-t border-border"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={sendMutation.isPending}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending}>
                      {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
