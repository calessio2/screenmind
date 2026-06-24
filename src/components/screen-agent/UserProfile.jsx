import React from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";

export default function UserProfile({ user, collapsed }) {
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (collapsed) {
    return (
      <Link
        to="/mis-objetivos"
        className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-semibold hover:ring-2 hover:ring-amber-500/30 transition-all flex-shrink-0"
        title={user?.full_name ? `${user.full_name} — Mis objetivos` : "Mis objetivos"}
      >
        {initials}
      </Link>
    );
  }

  return (
    <Link
      to="/mis-objetivos"
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
    >
      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate">{user?.full_name || "Usuario"}</p>
        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
          <Target className="w-2.5 h-2.5" />
          Mis objetivos
        </p>
      </div>
    </Link>
  );
}