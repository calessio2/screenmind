import React, { useState, useEffect } from "react";
import { Check, RotateCcw } from "lucide-react";

export default function DragDropGame({ config }) {
  const items = config?.game_items || [];
  const zones = config?.zones || [];
  const [placements, setPlacements] = useState({});
  const [completed, setCompleted] = useState(false);

  const placedItems = Object.values(placements);
  const unplacedItems = items.filter((item) => !placements[item.id]);

  const handleDragStart = (e, itemId) => {
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDrop = (e, zoneId) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (!itemId) return;
    setPlacements((prev) => ({ ...prev, [itemId]: zoneId }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeItem = (itemId) => {
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  React.useEffect(() => {
    if (items.length > 0 && Object.keys(placements).length === items.length) {
      const allCorrect = items.every((item) => placements[item.id] === item.correct_zone);
      if (allCorrect) setCompleted(true);
    }
  }, [placements, items]);

  const reset = () => {
    setPlacements({});
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-zinc-200 font-medium text-sm mb-2">¡Excelente!</h3>
        <p className="text-zinc-600 text-xs text-center max-w-xs">
          Colocaste todos los elementos en el lugar correcto.
        </p>
        <button
          onClick={reset}
          className="mt-6 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        <span className="text-xs text-zinc-400 font-medium">Juego de Arrastrar y Soltar</span>
        <span className="text-[10px] text-zinc-600 ml-auto">
          {Object.keys(placements).length} / {items.length} colocados
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {unplacedItems.length > 0 && (
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wide mb-2">Elementos para colocar</p>
            <div className="flex flex-wrap gap-2">
              {unplacedItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className="cursor-grab active:cursor-grabbing bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-200 hover:bg-white/[0.1] transition-colors select-none"
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wide mb-2">Zonas</p>
          <div className="grid grid-cols-2 gap-3">
            {zones.map((zone) => {
              const placedInZone = items.filter((item) => placements[item.id] === zone.id);
              return (
                <div
                  key={zone.id}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  onDragOver={handleDragOver}
                  className="min-h-[80px] border-2 border-dashed border-white/[0.1] rounded-xl p-3 space-y-1.5"
                >
                  <p className="text-xs font-medium text-zinc-400 mb-1">{zone.label}</p>
                  {placedInZone.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => removeItem(item.id)}
                      className="bg-blue-500/20 border border-blue-500/40 rounded-lg px-2.5 py-1.5 text-xs text-blue-200 cursor-pointer hover:bg-blue-500/30"
                      title="Clic para quitar"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}