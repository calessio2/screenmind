import React from "react";
import { Plus, MessageSquare, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ConversationSidebar({ conversations, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-3 border-b border-zinc-800">
        <Link to="/procesos" className="block mb-2">
          <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm rounded-lg h-9">
            <BookOpen className="w-4 h-4 mr-2" />
            Gestión de Procesos
          </Button>
        </Link>
        <Button
          onClick={onCreate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg h-9"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva conversación
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-zinc-600 text-xs text-center mt-8 px-3">
            No hay conversaciones aún
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              activeId === conv.id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate flex-1">{conv.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}