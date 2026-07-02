import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Youtube, Mail, MousePointerClick, Trash2, Search, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InteractiveContentForm from "@/components/interactive/InteractiveContentForm";
import { useNavigate } from "react-router-dom";

const typeConfig = {
  youtube: { label: "Video YouTube", icon: Youtube, color: "text-red-400", bg: "bg-red-500/10" },
  email_simulator: { label: "Sim. Email", icon: Mail, color: "text-blue-400", bg: "bg-blue-500/10" },
  drag_drop_game: { label: "Juego Drag & Drop", icon: MousePointerClick, color: "text-purple-400", bg: "bg-purple-500/10" },
  software_simulator: { label: "Sim. Software", icon: MousePointerClick, color: "text-amber-400", bg: "bg-amber-500/10" },
};

export default function Library() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchContents = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.InteractiveContent.filter({ status: "active" });
      setContents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContents(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este contenido?")) return;
    await base44.entities.InteractiveContent.delete(id);
    setContents((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    setShowForm(false);
    setEditing(null);
    fetchContents();
  };

  const filtered = contents.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.keywords?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 hover:bg-white/[0.08] transition-colors"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Biblioteca de Contenidos</h1>
              <p className="text-zinc-500 text-sm mt-1">Experiencias interactivas que el tutor puede lanzar</p>
            </div>
          </div>
          <Button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-white text-zinc-950 hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo contenido
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, categoría o palabras clave..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-600 text-sm">No hay contenidos disponibles aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((content) => {
              const tc = typeConfig[content.type] || typeConfig.drag_drop_game;
              const Icon = tc.icon;
              return (
                <div
                  key={content.id}
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${tc.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${tc.color}`} />
                    </div>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-200 mb-1">{content.title}</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed mb-3 line-clamp-2">
                    {content.description || "Sin descripción"}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
                      {tc.label}
                    </span>
                    {content.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-500">
                        {content.category}
                      </span>
                    )}
                    <button
                      onClick={() => { setEditing(content); setShowForm(true); }}
                      className="ml-auto text-[10px] text-blue-400 hover:text-blue-300"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <InteractiveContentForm
          content={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSave}
        />
      )}
    </div>
  );
}