import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { Send, Plus, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useStream } from "@/hooks/use-stream";
import { 
  useListOpenaiConversations, 
  useCreateOpenaiConversation, 
  useGetOpenaiConversation,
  useDeleteOpenaiConversation,
  getGetOpenaiConversationQueryKey,
  getListOpenaiConversationsQueryKey
} from "@workspace/api-client-react";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  
  const { data: conversations, isLoading: loadingConvs } = useListOpenaiConversations();
  const { mutateAsync: createConv, isPending: creatingConv } = useCreateOpenaiConversation();
  const { mutateAsync: deleteConv } = useDeleteOpenaiConversation();
  const { data: activeConv } = useGetOpenaiConversation(activeConvId!, { query: { enabled: !!activeConvId } });
  
  const { streamRequest, data: streamData, isLoading: isStreaming, reset: resetStream } = useStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, streamData]);

  const handleNewChat = async () => {
    const res = await createConv({ data: { title: "New Conversation" } });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setActiveConvId(res.id);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConv({ id });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    if (activeConvId === id) setActiveConvId(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConvId || isStreaming) return;

    const messageContent = input.trim();
    setInput("");
    
    // Optimistically add user message (optional, but good for UX)
    // Actually, we'll just let the stream UI handle it by keeping a local state or just trusting the fast refresh.
    // For simplicity, since the backend expects the POST and then returns the assistant stream,
    // the user message is saved in DB but we might not see it until we refetch.
    // Let's manually inject it into the cache for instant feel.
    queryClient.setQueryData(getGetOpenaiConversationQueryKey(activeConvId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [...old.messages, { id: Date.now(), role: 'user', content: messageContent }]
      };
    });

    await streamRequest(`/api/openai/conversations/${activeConvId}/messages`, { content: messageContent });
    
    // When done, invalidate to fetch the final saved assistant message
    queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(activeConvId) });
    resetStream();
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-6rem)] gap-6">
        {/* Chat History Sidebar */}
        <Card className="w-64 flex-shrink-0 flex flex-col overflow-hidden hidden lg:flex">
          <div className="p-4 border-b border-white/5">
            <Button onClick={handleNewChat} isLoading={creatingConv} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConvs ? (
              <div className="p-4 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
            ) : conversations?.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${
                  activeConvId === conv.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate text-sm font-medium">{conv.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDelete(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden relative">
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Assistant</h2>
              <p className="text-muted-foreground max-w-md">Select a conversation or start a new one to begin chatting with the advanced AI model.</p>
              <Button onClick={handleNewChat} className="mt-6">Start Chatting</Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {activeConv?.messages?.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-white/5 border border-white/10 text-foreground rounded-tl-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <Markdown content={msg.content} />
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {/* Streaming Message */}
                {isStreaming && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl p-4 bg-white/5 border border-white/10 text-foreground rounded-tl-sm">
                      <Markdown content={streamData + " ▋"} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-card border-t border-white/5">
                <form onSubmit={handleSend} className="relative flex items-center">
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="pr-14 h-14 bg-background"
                    disabled={isStreaming}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="absolute right-2 h-10 w-10 rounded-lg"
                    disabled={!input.trim() || isStreaming}
                  >
                    {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
}
