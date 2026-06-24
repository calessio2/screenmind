import React from "react";
import { Plus, MessageSquare, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ConversationSidebar({ conversations, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="w-64 bg-zinc-950 border-r border-white/[0.06] flex flex-col h-full">
      <div className="p-3 border-b border-white/[0.06] space-y-1">
        <Link to="/procesos" className="block">
          <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] text-sm rounded-lg h-9 font-normal">
            <BookOpen className="w-4 h-4 mr-2" />
            Gestión de Procesos
          </Button>
        </Link>
        <Button
          onClick={onCreate}
          className="w-full bg-white text-zinc-950 hover:bg-zinc-200 text-sm rounded-lg h-9 font-medium"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva conversación
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-zinc-700 text-xs text-center mt-8 px-3">
            No hay conversaciones aún
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              activeId === conv.id
                ? "bg-white/[0.06] text-zinc-100"
                : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
            <span className="text-sm truncate flex-1">{conv.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}