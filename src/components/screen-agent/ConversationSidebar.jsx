import React from "react";
import { Plus, MessageSquare, Trash2, BookOpen, PanelLeft, Target, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import UserProfile from "./UserProfile";

export default function ConversationSidebar({ conversations, activeId, onSelect, onCreate, onDelete, collapsed, onToggleCollapse, user }) {
  if (collapsed) {
    return (
      <div className="w-14 bg-zinc-950 border-r border-white/[0.06] flex flex-col items-center h-full py-3 gap-1">
        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors mb-1"
          title="Expandir sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onCreate}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
          title="Nueva conversación"
        >
          <Plus className="w-4 h-4" />
        </button>

        <Link
          to="/procesos"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
          title="Gestión de Procesos"
        >
          <BookOpen className="w-4 h-4" />
        </Link>

        <Link
          to="/biblioteca"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
          title="Biblioteca de Contenidos"
        >
          <LayoutGrid className="w-4 h-4" />
        </Link>

        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
          title="Ver conversaciones"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {user?.role === "admin" && (
          <Link
            to="/gestion-objetivos"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 hover:text-amber-400 hover:bg-white/[0.04] transition-colors"
            title="Gestión de Objetivos"
          >
            <Target className="w-4 h-4" />
          </Link>
        )}

        <div className="flex-1" />

        <UserProfile user={user} collapsed />
      </div>
    );
  }

  return (
    <div className="w-64 bg-zinc-950 border-r border-white/[0.06] flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-medium text-zinc-200">LIP Tutor</span>
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
          title="Colapsar sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 space-y-0.5">
        <Button
          onClick={onCreate}
          className="w-full bg-white text-zinc-950 hover:bg-zinc-200 text-sm rounded-lg h-9 font-medium justify-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo chat
        </Button>
        <Link to="/procesos" className="block">
          <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] text-sm rounded-lg h-9 font-normal">
            <BookOpen className="w-4 h-4 mr-2" />
            Gestión de Procesos
          </Button>
        </Link>
        <Link to="/biblioteca" className="block">
          <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] text-sm rounded-lg h-9 font-normal">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Biblioteca
          </Button>
        </Link>
        {user?.role === "admin" && (
          <Link to="/gestion-objetivos" className="block">
            <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-amber-400 hover:bg-white/[0.04] text-sm rounded-lg h-9 font-normal">
              <Target className="w-4 h-4 mr-2" />
              Gestión de Objetivos
            </Button>
          </Link>
        )}
      </div>

      <div className="px-4 pt-4 pb-1">
        <span className="text-xs font-medium text-zinc-600">Chats</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-zinc-700 text-xs text-center mt-6 px-3">
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

      <div className="p-2 border-t border-white/[0.06]">
        <UserProfile user={user} />
      </div>
    </div>
  );
}