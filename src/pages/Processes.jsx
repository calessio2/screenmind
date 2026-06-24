import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, BookOpen, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ProcessForm from "@/components/screen-agent/ProcessForm";

export default function Processes() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Process.list("-created_date", 100);
      setProcesses(list);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este proceso?")) return;
    await base44.entities.Process.delete(id);
    load();
  };

  const handleEdit = (process) => {
    setEditing(process);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSaved = () => {
    load();
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Gestión de Procesos</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Creá y administrá las guías que el tutor usa para enseñar</p>
            </div>
          </div>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo proceso
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-300 rounded-full animate-spin"></div>
          </div>
        ) : processes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">No hay procesos creados</p>
            <p className="text-zinc-600 text-xs mb-4">Creá tu primer proceso para que el tutor pueda guiar a los usuarios</p>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Crear proceso
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {processes.map((process) => (
              <div
                key={process.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-zinc-100 truncate">{process.title}</h3>
                      {process.software && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{process.software}</span>
                      )}
                    </div>
                    {process.description && (
                      <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{process.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                      <span>{process.steps?.length || 0} pasos</span>
                      {process.keywords && <span>· {process.keywords}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => handleEdit(process)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(process.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProcessForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        editingProcess={editing}
      />
    </div>
  );
}