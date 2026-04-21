"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient, getAccessToken } from "@/src/lib/supabase";
import { api } from "@/servicios/api";
import { Usuario, Conversacion, MensajeAPI } from "@/tipos";

// ─── UTILS ───────────────────────────────────────────────────────────────────

function formatearHora(ts: string) {
  return new Date(ts).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearFechaCorta(ts: string) {
  const fecha = new Date(ts);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────────

const PALETA = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#f97316",
  "#ec4899",
];

function Avatar({
  id,
  nombre,
  apellido,
  size = "md",
}: {
  id: number;
  nombre: string;
  apellido: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = PALETA[id % PALETA.length];
  const cls = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${cls}`}
      style={{ backgroundColor: color }}
    >
      {nombre[0]}
      {apellido[0]}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function VistaMensajeria() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const convId = searchParams.get("conv")
    ? Number(searchParams.get("conv"))
    : null;

  const [yo, setYo] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [mensajes, setMensajes] = useState<MensajeAPI[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mensajesRef = useRef<HTMLDivElement>(null);

  // Carga inicial: token + usuario + conversaciones
  useEffect(() => {
    let vivo = true;
    getAccessToken().then(async (t) => {
      if (!t || !vivo) return;
      setToken(t);
      const [me, convs] = await Promise.all([
        api.get<Usuario>("/auth/me", t),
        api.get<Conversacion[]>("/conversaciones/mis-conversaciones", t),
      ]);
      if (!vivo) return;
      setYo(me);
      setConversaciones(convs);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Carga mensajes cuando cambia la conversación activa
  useEffect(() => {
    if (!convId || !token) {
      setMensajes([]);
      return;
    }
    let vivo = true;
    api.get<MensajeAPI[]>(`/mensajes/${convId}`, token).then((data) => {
      if (vivo) setMensajes(data);
    });
    return () => {
      vivo = false;
    };
  }, [convId, token]);

  // Supabase Realtime — escucha mensajes nuevos del otro participante
  useEffect(() => {
    if (!convId || !yo) return;
    const conv = conversaciones.find((c) => c.id_conversacion === convId);
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`conv-${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensaje" },
        (payload) => {
          console.log("[Realtime] evento INSERT:", payload.new);
          const row = payload.new as {
            id_mensaje: number;
            contenido: string;
            creado_en: string;
            id_conversacion: number;
            id_usuario_emisor: number;
          };
          // ignorar si es otra conv o si lo mandé yo (ya lo agregamos optimisticamente)
          if (
            row.id_conversacion !== convId ||
            row.id_usuario_emisor === yo.id_usuario
          )
            return;

          const emisorData = conv?.participantes.find(
            (p) => p.usuario.id_usuario === row.id_usuario_emisor,
          )?.usuario;
          if (!emisorData) return;

          setMensajes((prev) =>
            prev.some((m) => m.id_mensaje === row.id_mensaje)
              ? prev
              : [
                  ...prev,
                  {
                    id_mensaje: row.id_mensaje,
                    contenido: row.contenido,
                    creado_en: row.creado_en,
                    emisor: emisorData,
                  },
                ],
          );
        },
      )
      .subscribe((status, err) => {
        console.log("[Realtime] status:", status, err ?? "");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [convId, yo, conversaciones]);

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajesRef.current)
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
  }, [mensajes.length, convId]);

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  function otroParticipante(conv: Conversacion) {
    return (
      conv.participantes.find((p) => p.usuario.id_usuario !== yo?.id_usuario)
        ?.usuario ?? null
    );
  }

  const convActiva =
    conversaciones.find((c) => c.id_conversacion === convId) ?? null;
  const contactoActivo = convActiva ? otroParticipante(convActiva) : null;

  const convsFiltradas = conversaciones.filter((c) => {
    const otro = otroParticipante(c);
    return (
      otro &&
      `${otro.nombre_usuario} ${otro.apellido_usuario}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  });

  const fechasUnicas = [
    ...new Set(mensajes.map((m) => new Date(m.creado_en).toDateString())),
  ];

  // ─── ACCIONES ─────────────────────────────────────────────────────────────

  async function enviarMensaje(e?: React.FormEvent) {
    e?.preventDefault();
    if (!nuevoMensaje.trim() || !convId || !yo || !token || enviando) return;
    const contenido = nuevoMensaje.trim();
    setNuevoMensaje("");
    setEnviando(true);
    try {
      const nuevo = await api.post<{
        id_mensaje: number;
        contenido: string;
        creado_en: string;
      }>(
        "/mensajes",
        {
          contenido,
          id_conversacion: convId,
          id_usuario_emisor: yo.id_usuario,
        },
        token,
      );
      setMensajes((prev) =>
        prev.some((m) => m.id_mensaje === nuevo.id_mensaje)
          ? prev
          : [
              ...prev,
              {
                ...nuevo,
                emisor: {
                  id_usuario: yo.id_usuario,
                  nombre_usuario: yo.nombre_usuario,
                  apellido_usuario: yo.apellido_usuario,
                },
              },
            ],
      );
    } catch {
      setNuevoMensaje(contenido);
    } finally {
      setEnviando(false);
    }
  }

  function manejarTecla(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* ── Panel izquierdo: lista de conversaciones ── */}
      <div
        className={`flex w-full flex-col border-r border-gray-200 dark:border-gray-700 sm:w-80 sm:shrink-0 ${
          convId !== null ? "hidden sm:flex" : "flex"
        }`}
      >
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
            Mensajes
          </h2>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convsFiltradas.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              {conversaciones.length === 0
                ? "No tenés conversaciones aún"
                : "No se encontraron conversaciones"}
            </p>
          ) : (
            convsFiltradas.map((conv) => {
              const otro = otroParticipante(conv);
              if (!otro) return null;
              const ultimo = conv.mensajes[0];
              const esActiva = convId === conv.id_conversacion;
              return (
                <button
                  key={conv.id_conversacion}
                  onClick={() =>
                    router.push(`/mensajes?conv=${conv.id_conversacion}`)
                  }
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    esActiva ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                  }`}
                >
                  <Avatar
                    id={otro.id_usuario}
                    nombre={otro.nombre_usuario}
                    apellido={otro.apellido_usuario}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {otro.nombre_usuario} {otro.apellido_usuario}
                    </span>
                    {ultimo && (
                      <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                        {ultimo.contenido}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {yo && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <Avatar
              id={yo.id_usuario}
              nombre={yo.nombre_usuario}
              apellido={yo.apellido_usuario}
              size="sm"
            />
            <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
              {yo.nombre_usuario} {yo.apellido_usuario}
            </p>
          </div>
        )}
      </div>

      {/* ── Panel derecho: chat ── */}
      <div
        className={`flex flex-1 flex-col ${convId !== null ? "flex" : "hidden sm:flex"}`}
      >
        {contactoActivo ? (
          <>
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <button
                onClick={() => router.push("/mensajes")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 sm:hidden"
                aria-label="Volver"
              >
                ←
              </button>
              <Avatar
                id={contactoActivo.id_usuario}
                nombre={contactoActivo.nombre_usuario}
                apellido={contactoActivo.apellido_usuario}
                size="md"
              />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {contactoActivo.nombre_usuario}{" "}
                {contactoActivo.apellido_usuario}
              </h3>
            </div>

            <div
              ref={mensajesRef}
              className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
            >
              {mensajes.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <Avatar
                    id={contactoActivo.id_usuario}
                    nombre={contactoActivo.nombre_usuario}
                    apellido={contactoActivo.apellido_usuario}
                    size="lg"
                  />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {contactoActivo.nombre_usuario}{" "}
                    {contactoActivo.apellido_usuario}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    No hay mensajes aún. ¡Empezá la conversación!
                  </p>
                </div>
              ) : (
                fechasUnicas.map((fechaStr) => {
                  const delDia = mensajes.filter(
                    (m) => new Date(m.creado_en).toDateString() === fechaStr,
                  );
                  return (
                    <div key={fechaStr} className="flex flex-col gap-1">
                      <div className="my-3 flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-100 dark:border-gray-700" />
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatearFechaCorta(delDia[0].creado_en)}
                        </span>
                        <div className="flex-1 border-t border-gray-100 dark:border-gray-700" />
                      </div>
                      {delDia.map((msg) => {
                        const esMio = msg.emisor.id_usuario === yo?.id_usuario;
                        return (
                          <div
                            key={msg.id_mensaje}
                            className={`flex ${esMio ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`group flex max-w-[75%] flex-col gap-0.5 ${esMio ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                  esMio
                                    ? "rounded-br-sm bg-indigo-600 text-white"
                                    : "rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                                }`}
                              >
                                {msg.contenido}
                              </div>
                              <span className="text-[10px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500">
                                {formatearHora(msg.creado_en)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={enviarMensaje}
              className="flex items-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700"
            >
              <textarea
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={manejarTecla}
                placeholder="Escribí un mensaje... (Enter para enviar)"
                rows={1}
                disabled={enviando}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 disabled:opacity-60"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = `${t.scrollHeight}px`;
                }}
              />
              <button
                type="submit"
                disabled={!nuevoMensaje.trim() || enviando}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-40"
                aria-label="Enviar mensaje"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 translate-x-0.5"
                >
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-gray-300 dark:text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccioná una conversación
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Elegí un contacto del panel izquierdo
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
