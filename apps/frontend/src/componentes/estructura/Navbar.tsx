"use client";

import { getSupabaseClient } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  async function cerrarSesion() {
    await getSupabaseClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            SIC
          </span>
        </div>

        <nav className="hidden items-center gap-6 sm:flex">
          <a
            href="/perfil"
            className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            Perfil
          </a>
          <a
            href="/calendario"
            className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            Calendario
          </a>
          <a
            href="/mensajes"
            className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            Mensajes
          </a>
        </nav>

        <button
          onClick={cerrarSesion}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
