import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
function Icon({ children, className, spin }: { children: React.ReactNode; className?: string; spin?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={spin ? `animate-spin ${className ?? ""}` : className}
    >
      {children}
    </svg>
  );
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  conversationId: string;
  conversationType: "trade" | "standalone";
  otherUserId: string;
  otherUser: {
    firstName: string;
    lastName: string;
    businessName: string | null;
    role: string;
    avatarUrl?: string | null;
  };
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

interface ChatWidgetProps {
  userId?: string;
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", className)} {...props}>
      {children}
    </div>
  );
}

export function ChatWidget({ userId }: ChatWidgetProps) {
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

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ["chat", selectedChatId],
    queryFn: () => customFetch(`/api/v1/messages/${selectedChatId}`),
    enabled: !!selectedChatId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedChatId) return;
      return customFetch(`/api/v1/messages/${selectedChatId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      setMessage("");
      if (selectedChatId) {
        queryClient.invalidateQueries({ queryKey: ["chat", selectedChatId] });
        queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      }
    },
    onError: (err: any) => console.error("Failed to send message:", err),
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
    },
    onError: (err: any) => console.error("Failed to create conversation:", err),
  });

  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData, isOpen, isMinimized]);

  useEffect(() => {
    if (showNewChat && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showNewChat]);

  const conversations = conversationsData?.data ?? [];
  const messages = messagesData?.messages ?? [];
  const unreadCount = conversations.filter(c => c.unread).length;
  const selectedConv = conversations.find(c => c.conversationId === selectedChatId);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
      >
        <Icon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-6 w-6 flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] flex flex-col shadow-2xl rounded-xl overflow-hidden bg-background border border-border">
          <div className="rounded-none border-0 border-b border-border bg-card">
            <div className="p-4 flex flex-row items-center justify-between">
              <p className="text-lg font-semibold leading-none tracking-tight">
                {showNewChat ? "New Conversation" : selectedChatId && selectedConv
                  ? (selectedConv.otherUser.businessName ?? `${selectedConv.otherUser.firstName} ${selectedConv.otherUser.lastName}`)
                  : "Messages"}
              </p>
              <div className="flex items-center gap-2">
                {selectedChatId && (
                  <button onClick={() => setSelectedChatId(null)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
                    <Icon className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
                  </button>
                )}
                {showNewChat && (
                  <button onClick={() => { setShowNewChat(false); setSearchQuery(""); }} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
                    <Icon className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
                  </button>
                )}
                <button onClick={() => setIsMinimized(!isMinimized)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
                  {isMinimized ? <Icon className="h-4 w-4"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></Icon> : <Icon className="h-4 w-4"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></Icon>}
                </button>
                <button onClick={() => setIsOpen(false)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
                  <Icon className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {showNewChat ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
                      <input
                        ref={searchInputRef}
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-9"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {searchQuery.length < 1 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Type to search users</p>
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
                              <p className="text-xs text-muted-foreground truncate">{su.role}{su.phone ? ` • ${su.phone}` : ""}</p>
                            </div>
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : !selectedChatId ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-border flex gap-1">
                    <button onClick={() => setShowNewChat(true)} className="inline-flex items-center justify-center gap-1.5 text-xs flex-1 min-h-8 rounded-md px-3 hover:bg-accent transition-colors font-medium">
                      <Icon className="h-3.5 w-3.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon> New Chat
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {conversationsLoading ? (
                      <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
                    ) : conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <Icon className="h-12 w-12 text-muted-foreground/30 mb-3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>
                        <p className="text-muted-foreground text-sm">No conversations yet</p>
                        <button onClick={() => setShowNewChat(true)} className="inline-flex items-center justify-center text-sm underline-offset-4 hover:underline text-primary font-medium h-9 px-4 rounded-md">
                          Start a new chat
                        </button>
                      </div>
                    ) : (
                      conversations.map((conv) => {
                        const name = conv.otherUser.businessName ?? `${conv.otherUser.firstName} ${conv.otherUser.lastName}`;
                        return (
                          <div
                            key={conv.conversationId}
                            className={`rounded-xl border bg-card text-card-foreground shadow cursor-pointer hover:border-primary/40 transition-colors ${conv.unread ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                            onClick={() => setSelectedChatId(conv.conversationId)}
                          >
                            <div className="flex items-center gap-3 p-3">
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
                            </div>
                          </div>
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
                        const isCurrentUser = msg.senderId === "me" || msg.senderId === userId;
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
                    <input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={sendMutation.isPending}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || sendMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 w-9"
                    >
                      {sendMutation.isPending ? <Icon className="h-4 w-4" spin><path d="M21 12a9 9 0 1 1-6.219-8.56" /></Icon> : <Icon className="h-4 w-4"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Icon>}
                    </button>
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
