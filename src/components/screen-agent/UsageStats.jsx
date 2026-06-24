import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Activity, Clock, TrendingUp, Sparkles } from "lucide-react";

export default function UsageStats({ userId }) {
  const [stats, setStats] = useState(null);
  const [topQueries, setTopQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const conversations = await base44.entities.Conversation.filter({ created_by_id: userId }, "-created_date", 100);
        const allMessages = conversations.flatMap(c => c.messages || []);
        const userMessages = allMessages.filter(m => m.role === "user");

        let daysActive = 0;
        if (conversations.length > 0) {
          const dates = conversations.map(c => new Date(c.created_date).toDateString());
          const uniqueDays = [...new Set(dates)];
          daysActive = uniqueDays.length;
        }

        const lastActivity = conversations.length > 0 ? conversations[0].created_date : null;

        setStats({
          totalConversations: conversations.length,
          totalMessages: userMessages.length,
          daysActive,
          lastActivity,
        });

        if (userMessages.length > 0) {
          setAnalyzing(true);
          const sampleMessages = userMessages.slice(0, 50).map(m => m.content).filter(Boolean);
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Analizá estas consultas de un usuario a un tutor de adopción digital. Identificá los 3 temas o tipos de consulta más frecuentes.\n\nConsultas:\n${sampleMessages.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nRespondé en español argentino, en formato JSON: {"queries": [{"topic": "tema corto (2-4 palabras)", "count": número_estimado}]}\n\nOrdená de mayor a menor frecuencia. Los temas deben ser específicos (ej: "Historia clínica Geclisa", "Exportar PDF", "Sistema de vacaciones").`,
            response_json_schema: {
              type: "object",
              properties: {
                queries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" },
                      count: { type: "number" }
                    }
                  }
                }
              }
            }
          });
          if (result?.queries) setTopQueries(result.queries.slice(0, 3));
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
        setAnalyzing(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-600 py-4">
        <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        Cargando estadísticas...
      </div>
    );
  }

  if (!stats || stats.totalConversations === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 text-center">
        <Activity className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
        <p className="text-xs text-zinc-500">Aún no hay actividad en el tutor</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Consultas</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-100">{stats.totalConversations}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">conversaciones</p>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Mensajes</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-100">{stats.totalMessages}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">enviados al tutor</p>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Días activo</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-100">{stats.daysActive}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            {stats.lastActivity ? `último: ${new Date(stats.lastActivity).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}` : ""}
          </p>
        </div>
      </div>

      {topQueries.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-zinc-400 font-medium">Top 3 consultas</span>
            {analyzing && (
              <span className="text-[10px] text-zinc-600 flex items-center gap-1 ml-auto">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                analizando...
              </span>
            )}
          </div>
          <div className="space-y-2">
            {topQueries.map((q, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                  i === 0 ? "bg-amber-500/20 text-amber-400" :
                  i === 1 ? "bg-zinc-700 text-zinc-300" :
                  "bg-zinc-800 text-zinc-500"
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm text-zinc-300 flex-1 truncate">{q.topic}</span>
                <span className="text-[11px] text-zinc-600 flex-shrink-0">{q.count} consultas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}