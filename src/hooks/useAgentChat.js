import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useAgentChat(agentName) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convMap, setConvMap] = useState({});

  // Load conversations on mount
  useEffect(() => {
    base44.agents.listConversations({ agent_name: agentName }).then((convs) => {
      const mapped = convs.map(c => ({
        id: c.id,
        title: c.metadata?.name || "Sin título",
        ...c
      }));
      setConversations(mapped);
      const map = {};
      convs.forEach(c => { map[c.id] = c; });
      setConvMap(map);
    }).catch(() => {});
  }, [agentName]);

  // Subscribe to active conversation
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    base44.agents.getConversation(activeConvId).then(conv => {
      setConvMap(prev => ({ ...prev, [activeConvId]: conv }));
      setMessages(conv.messages || []);
    }).catch(() => {});

    const unsubscribe = base44.agents.subscribeToConversation(activeConvId, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [activeConvId]);

  const selectConversation = useCallback((id) => {
    setActiveConvId(id);
  }, []);

  const createConversation = useCallback(async () => {
    const title = `Sesión ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`;
    const conv = await base44.agents.createConversation({
      agent_name: agentName,
      metadata: { name: title, description: title }
    });
    setConvMap(prev => ({ ...prev, [conv.id]: conv }));
    setConversations(prev => [{ id: conv.id, title, ...conv }, ...prev]);
    setActiveConvId(conv.id);
    return conv;
  }, [agentName]);

  const deleteConversation = useCallback(async (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setConvMap(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeConvId === id) {
      setActiveConvId(null);
    }
  }, [activeConvId]);

  const sendMessage = useCallback(async (text, fileUrls) => {
    if (!activeConvId) return;
    setIsLoading(true);
    try {
      let conv = convMap[activeConvId];
      if (!conv) {
        conv = await base44.agents.getConversation(activeConvId);
        setConvMap(prev => ({ ...prev, [activeConvId]: conv }));
      }
      await base44.agents.addMessage(conv, {
        role: "user",
        content: text,
        ...(fileUrls ? { file_urls: fileUrls } : {})
      });
      // Safety: clear loading after addMessage resolves (in case subscription already delivered the response)
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  }, [activeConvId, convMap]);

  return {
    conversations,
    activeConvId,
    messages,
    isLoading,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
  };
}