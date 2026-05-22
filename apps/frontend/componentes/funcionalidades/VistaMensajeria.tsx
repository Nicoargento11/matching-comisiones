"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import Avatar from "@/componentes/interfaz/Avatar";
import RolBadge from "@/componentes/interfaz/RolBadge";
import { formatearHora, formatearFechaCorta } from "@/lib/fechas";
import { useMensajeria } from "./_hooks/useMensajeria";

export default function VistaMensajeria() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const convId = searchParams.get("conv") ? Number(searchParams.get("conv")) : null;

  const { token, yo } = useAuth();
  const {
    mensajes,
    busqueda,
    setBusqueda,
    nuevoMensaje,
    setNuevoMensaje,
    enviando,
    toasts,
    setToasts,
    mensajesRef,
    contactoActivo,
    rolContactoActivo,
    convsFiltradas,
    fechasUnicas,
    otroParticipante,
    enviarMensaje,
    manejarTecla,
  } = useMensajeria(convId, token, yo);

  return (
    <>
      {/* ── Toasts de mensajes entrantes ── */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              router.push(`/mensajes?conv=${t.convId}`);
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className="pointer-events-auto flex w-72 items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-lg ring-1 ring-black/5 transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
            style={{ animation: "slideInRight 0.3s ease" }}
          >
            <Avatar id={t.idUsuario} nombre={t.nombre} apellido={t.apellido} size="sm" />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {t.nombre} {t.apellido}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{t.contenido}</p>
            </div>
            <span className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
          </button>
        ))}
      </div>

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
                No se encontraron conversaciones
              </p>
            ) : (
              convsFiltradas.map((conv) => {
                const otro = otroParticipante(conv);
                if (!otro) return null;
                const ultimo = conv.mensajes[0];
                const esActiva = convId === conv.id_conversacion;
                const rol = otro.roles?.some((r) => r.rol?.nombre_rol === "profesor")
                  ? "Profe"
                  : otro.roles?.some((r) => r.rol?.nombre_rol === "estudiante")
                  ? "Alumno"
                  : null;
                return (
                  <button
                    key={conv.id_conversacion}
                    onClick={() => router.push(`/mensajes?conv=${conv.id_conversacion}`)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
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
                      <div className="flex items-center gap-1.5">
                        <span className="block truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                          {otro.nombre_usuario} {otro.apellido_usuario}
                        </span>
                        {rol && <RolBadge rol={rol} />}
                      </div>
                      {ultimo && (
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                          {ultimo.contenido}
                        </p>
                      )}
                    </div>
                    {ultimo && (
                      <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-600">
                        {formatearHora(ultimo.creado_en)}
                      </span>
                    )}
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
        <div className={`flex flex-1 flex-col ${convId !== null ? "flex" : "hidden sm:flex"}`}>
          {contactoActivo ? (
            <>
              {/* Header */}
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {contactoActivo.nombre_usuario} {contactoActivo.apellido_usuario}
                    </h3>
                    {rolContactoActivo && <RolBadge rol={rolContactoActivo} />}
                  </div>
                </div>
              </div>

              {/* Mensajes */}
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
                      {contactoActivo.nombre_usuario} {contactoActivo.apellido_usuario}
                    </p>
                    {rolContactoActivo && <RolBadge rol={rolContactoActivo} />}
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
                        {delDia.map((msg, idx) => {
                          const esMio = msg.emisor.id_usuario === yo?.id_usuario;
                          const prevMsg = idx > 0 ? delDia[idx - 1] : null;
                          const mostrarNombre =
                            !esMio &&
                            (idx === 0 || prevMsg?.emisor.id_usuario !== msg.emisor.id_usuario);
                          return (
                            <div
                              key={msg.id_mensaje}
                              className={`flex ${esMio ? "justify-end" : "justify-start"} ${
                                idx > 0 && prevMsg?.emisor.id_usuario === msg.emisor.id_usuario
                                  ? "mt-0.5"
                                  : "mt-2"
                              }`}
                            >
                              <div
                                className={`flex max-w-[75%] flex-col gap-0.5 ${
                                  esMio ? "items-end" : "items-start"
                                }`}
                              >
                                {mostrarNombre && (
                                  <span className="px-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                    {msg.emisor.nombre_usuario}
                                  </span>
                                )}
                                <div
                                  className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                    esMio
                                      ? "rounded-br-sm bg-indigo-600 text-white"
                                      : "rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                                  }`}
                                >
                                  {msg.contenido}
                                </div>
                                <span className="px-0.5 text-[10px] text-gray-400 dark:text-gray-500">
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

              {/* Input */}
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

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
