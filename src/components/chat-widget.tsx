import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, X, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  tradeId: string;
  otherUserId: string;
  otherUser: { 
    firstName: string; 
    lastName: string; 
    businessName: string | null; 
    role: string 
  };
  lastMessage: { content: string; createdAt: string };
  unread: boolean;
}

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery<{ data: Conversation[] }>({
    queryKey: ["chat-conversations"],
    queryFn: () => customFetch("/api/v1/messages/conversations"),
    enabled: isOpen,
    refetchInterval: 5000,
  });

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  // Local state for real-time messages
  const [wsMessages, setWsMessages] = useState<Message[]>([]);

  // Fetch messages for selected trade
  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ["chat", selectedTradeId],
    queryFn: () => customFetch(`/api/v1/messages/${selectedTradeId}`),
    enabled: !!selectedTradeId,
  });

  // Send message mutation (REST fallback)
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedTradeId) return;
      
      // Try to send via WebSocket first
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "message",
          tradeId: selectedTradeId,
          content,
          messageType: "TEXT",
        }));
        return;
      }

      // Fallback to REST
      return customFetch(`/api/v1/messages/${selectedTradeId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      setMessage("");
      if (selectedTradeId) {
        queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      }
    },
    onError: (err: any) => console.error("Failed to send message:", err),
  });

  // WebSocket connection
  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Chat WS connected");
    };

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

    ws.onerror = (err) => {
      console.error("Chat WS error", err);
    };

    ws.onclose = () => {
      console.log("Chat WS closed");
      wsRef.current = null;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isOpen, queryClient]);

  // Join/leave rooms when selectedTradeId changes
  useEffect(() => {
    if (!wsRef.current) return;

    if (selectedTradeId) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "join", tradeId: selectedTradeId }));
      } else {
        wsRef.current.onopen = () => {
          wsRef.current?.send(JSON.stringify({ type: "join", tradeId: selectedTradeId }));
        };
      }
    }

    return () => {
      // No need to leave, since we clean up when component unmounts
    };
  }, [selectedTradeId]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (selectedTradeId) {
      customFetch(`/api/v1/messages/${selectedTradeId}/read`, { method: "PATCH" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["chat-conversations"] }))
        .catch(err => console.error("Failed to mark as read", err));
    }
  }, [selectedTradeId, queryClient]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData, wsMessages, isOpen, isMinimized]);

  const conversations = conversationsData?.data ?? [];
  const historyMessages: Message[] = messagesData?.messages ?? [];
  const messages = [...historyMessages, ...wsMessages];

  // Calculate unread count
  const unreadCount = conversations.filter(c => c.unread).length;

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 bg-red-500 text-white h-6 w-6 flex items-center justify-center"
          >
            {unreadCount}
          </Badge>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] flex flex-col shadow-2xl rounded-xl overflow-hidden bg-background border border-border">
          {/* Header */}
          <Card className="rounded-none border-0 border-b border-border">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {selectedTradeId ? (
                  conversations.find(c => c.tradeId === selectedTradeId)?.otherUser.businessName ?? 
                  `${conversations.find(c => c.tradeId === selectedTradeId)?.otherUser.firstName} ${conversations.find(c => c.tradeId === selectedTradeId)?.otherUser.lastName}`
                ) : (
                  "Messages"
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedTradeId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedTradeId(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Body */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedTradeId ? (
                // Conversations list
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {conversationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No conversations yet</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <Card 
                        key={conv.tradeId}
                        className={`cursor-pointer hover:border-primary/40 transition-colors ${conv.unread ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                        onClick={() => setSelectedTradeId(conv.tradeId)}
                      >
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                            {(conv.otherUser.businessName?.[0] ?? conv.otherUser.firstName[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate text-foreground">
                                {conv.otherUser.businessName ?? `${conv.otherUser.firstName} ${conv.otherUser.lastName}`}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                {conv.unread && <div className="h-2 w-2 rounded-full bg-primary" />}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                // Chat with selected user
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
                        // Check if sender is current user
                        const isCurrentUser = user?.id && msg.senderId === user.id;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div 
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              }`}
                            >
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
                  
                  {/* Message input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (message.trim()) sendMutation.mutate(message.trim());
                    }}
                    className="flex items-center gap-2 p-3 border-t border-border"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={sendMutation.isPending}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!message.trim() || sendMutation.isPending}
                    >
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