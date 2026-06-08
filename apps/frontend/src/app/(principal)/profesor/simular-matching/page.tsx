'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { usuarioServicio } from '@/servicios/usuarioServicio';
import { matchingServicio } from '@/servicios/matchingServicio';
import type { CandidatoIntercambio } from '@/servicios/matchingServicio';
import type { UsuarioBusquedaPorDni, Comision } from '@/tipos';

interface UsuarioSeleccionado {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
}

interface SelectorState {
  query: string;
  resultados: UsuarioBusquedaPorDni[];
  buscando: boolean;
  dropdownAbierto: boolean;
  usuarioSeleccionado: UsuarioSeleccionado | null;
  comisiones: Comision[];
  cargandoComisiones: boolean;
  comisionSeleccionadaId: number | null;
}

interface CandidatosState {
  lista: CandidatoIntercambio[];
  cargando: boolean;
  error: string | null;
  seleccionado: CandidatoIntercambio | null;
}

const estadoInicial: SelectorState = {
  query: '',
  resultados: [],
  buscando: false,
  dropdownAbierto: false,
  usuarioSeleccionado: null,
  comisiones: [],
  cargandoComisiones: false,
  comisionSeleccionadaId: null,
};

const candidatosInicial: CandidatosState = {
  lista: [],
  cargando: false,
  error: null,
  seleccionado: null,
};

function nombreComision(c: Comision): string {
  if (c.nombre_comision) return c.nombre_comision;
  if (c.numero_comision != null) return `Com. ${c.numero_comision}`;
  return c.materia.nombre_materia;
}

function nombreComisionCandidato(c: CandidatoIntercambio['comision']): string {
  if (c.nombre_comision) return c.nombre_comision;
  if (c.numero_comision != null) return `Com. ${c.numero_comision}`;
  return `Comisión #${c.id_comision}`;
}

function claveCandidato(c: CandidatoIntercambio): string {
  return `${c.usuario.id_usuario}-${c.comision.id_comision}`;
}

export default function SimularMatchingPage() {
  const { token } = useAuth();

  const [solicitante, setSolicitante] = useState<SelectorState>(estadoInicial);
  const [candidatos, setCandidatos] = useState<CandidatosState>(candidatosInicial);

  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<{ exito: boolean; mensaje: string } | null>(null);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  const refSolicitante = useRef<HTMLDivElement>(null);
  const timerSolicitante = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar dropdown al clickear fuera
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (refSolicitante.current && !refSolicitante.current.contains(e.target as Node)) {
        setSolicitante((prev) => ({ ...prev, dropdownAbierto: false }));
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Temporizador durante la simulación
  useEffect(() => {
    if (!cargando) {
      setTiempoTranscurrido(0);
      return;
    }
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      setTiempoTranscurrido(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [cargando]);

  const cargarComisiones = useCallback(
    async (idUsuario: number) => {
      setSolicitante((prev) => ({ ...prev, cargandoComisiones: true, comisiones: [] }));
      try {
        const comisiones = await usuarioServicio.obtenerComisiones(idUsuario, token ?? undefined);
        setSolicitante((prev) => ({ ...prev, comisiones, cargandoComisiones: false }));
      } catch {
        setSolicitante((prev) => ({ ...prev, comisiones: [], cargandoComisiones: false }));
      }
    },
    [token],
  );

  const handleQueryChange = useCallback(
    (valor: string) => {
      setSolicitante((prev) => ({
        ...prev,
        query: valor,
        dropdownAbierto: valor.length >= 3,
        usuarioSeleccionado: null,
        comisiones: [],
        comisionSeleccionadaId: null,
      }));

      if (timerSolicitante.current) clearTimeout(timerSolicitante.current);

      if (valor.length < 3) {
        setSolicitante((prev) => ({ ...prev, resultados: [], buscando: false }));
        return;
      }

      setSolicitante((prev) => ({ ...prev, buscando: true }));

      timerSolicitante.current = setTimeout(async () => {
        try {
          const resultados = await usuarioServicio.buscarParaMensajeria(
            valor,
            undefined,
            token ?? undefined,
          );
          setSolicitante((prev) => ({ ...prev, resultados, buscando: false, dropdownAbierto: true }));
        } catch {
          setSolicitante((prev) => ({ ...prev, resultados: [], buscando: false }));
        }
      }, 350);
    },
    [token],
  );

  const handleSeleccionarSolicitante = useCallback(
    (usuario: UsuarioBusquedaPorDni) => {
      const seleccionado: UsuarioSeleccionado = {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        apellido_usuario: usuario.apellido_usuario,
      };
      setSolicitante((prev) => ({
        ...prev,
        usuarioSeleccionado: seleccionado,
        dropdownAbierto: false,
        resultados: [],
        comisionSeleccionadaId: null,
      }));
      cargarComisiones(usuario.id_usuario);
    },
    [cargarComisiones],
  );

  const handleDeseleccionarSolicitante = useCallback(() => {
    setSolicitante(estadoInicial);
  }, []);

  // Busca candidatos de intercambio cuando ya están elegidos solicitante y comisión origen
  useEffect(() => {
    const idUsuario = solicitante.usuarioSeleccionado?.id_usuario;
    const idComision = solicitante.comisionSeleccionadaId;

    if (!idUsuario || !idComision) {
      setCandidatos(candidatosInicial);
      return;
    }

    let cancelado = false;
    setCandidatos({ lista: [], cargando: true, error: null, seleccionado: null });

    matchingServicio
      .obtenerCandidatos(idComision, idUsuario, token ?? undefined)
      .then((lista) => {
        if (cancelado) return;
        setCandidatos({ lista, cargando: false, error: null, seleccionado: null });
      })
      .catch(() => {
        if (cancelado) return;
        setCandidatos({
          lista: [],
          cargando: false,
          error: 'No se pudieron cargar los candidatos.',
          seleccionado: null,
        });
      });

    return () => {
      cancelado = true;
    };
  }, [solicitante.usuarioSeleccionado?.id_usuario, solicitante.comisionSeleccionadaId, token]);

  const puedeSimular =
    solicitante.usuarioSeleccionado !== null &&
    solicitante.comisionSeleccionadaId !== null &&
    candidatos.seleccionado !== null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!puedeSimular) return;

    setCargando(true);
    setResultado(null);

    try {
      const respuesta = await matchingServicio.simular(
        {
          usuarioSolicitanteId: solicitante.usuarioSeleccionado!.id_usuario,
          usuarioReceptorId: candidatos.seleccionado!.usuario.id_usuario,
          comisionOrigenId: solicitante.comisionSeleccionadaId!,
          comisionDestinoId: candidatos.seleccionado!.comision.id_comision,
        },
        token ?? undefined,
      );
      setResultado({ exito: true, mensaje: respuesta.mensaje });
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      setResultado({ exito: false, mensaje });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Simular Matching
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Disparar el proceso de matching para observar la generación del comprobante y las
        notificaciones.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario Solicitante
              </label>

              {solicitante.usuarioSeleccionado ? (
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 bg-gray-50">
                  <span className="flex-1 text-gray-900 dark:text-gray-100">
                    {solicitante.usuarioSeleccionado.apellido_usuario},{' '}
                    {solicitante.usuarioSeleccionado.nombre_usuario}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeseleccionarSolicitante}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 leading-none"
                    aria-label="Deseleccionar usuario"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div ref={refSolicitante} className="relative">
                  <input
                    type="text"
                    value={solicitante.query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onFocus={() => {
                      if (solicitante.resultados.length > 0) {
                        setSolicitante((prev) => ({ ...prev, dropdownAbierto: true }));
                      }
                    }}
                    placeholder="Buscar por nombre..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />

                  {solicitante.dropdownAbierto && (
                    <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {solicitante.buscando ? (
                        <li className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 inline-block shrink-0" />
                          Buscando...
                        </li>
                      ) : solicitante.resultados.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          Sin resultados
                        </li>
                      ) : (
                        solicitante.resultados.map((u) => (
                          <li
                            key={u.id_usuario}
                            onClick={() => handleSeleccionarSolicitante(u)}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-900 dark:text-gray-100"
                          >
                            {u.apellido_usuario}, {u.nombre_usuario} — DNI: {u.dni}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comisión Origen
              </label>

              {!solicitante.usuarioSeleccionado ? (
                <select
                  disabled
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 opacity-50 cursor-not-allowed"
                >
                  <option>Seleccioná un usuario primero</option>
                </select>
              ) : solicitante.cargandoComisiones ? (
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm w-full text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 inline-block shrink-0" />
                  Cargando comisiones...
                </div>
              ) : solicitante.comisiones.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  Este usuario no tiene comisiones activas
                </p>
              ) : (
                <select
                  value={solicitante.comisionSeleccionadaId ?? ''}
                  onChange={(e) =>
                    setSolicitante((prev) => ({
                      ...prev,
                      comisionSeleccionadaId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Seleccioná una comisión</option>
                  {solicitante.comisiones.map((c) => (
                    <option key={c.id_comision} value={c.id_comision}>
                      {nombreComision(c)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Intercambio disponible
              </label>

              {!solicitante.usuarioSeleccionado || !solicitante.comisionSeleccionadaId ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  Elegí primero el solicitante y su comisión origen
                </p>
              ) : candidatos.cargando ? (
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm w-full text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 inline-block shrink-0" />
                  Buscando candidatos...
                </div>
              ) : candidatos.error ? (
                <p className="text-sm text-red-600 dark:text-red-400 py-2">{candidatos.error}</p>
              ) : candidatos.lista.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  No hay alumnos con inscripción activa en otras comisiones de esta materia
                </p>
              ) : (
                <select
                  value={candidatos.seleccionado ? claveCandidato(candidatos.seleccionado) : ''}
                  onChange={(e) => {
                    const elegido =
                      candidatos.lista.find((c) => claveCandidato(c) === e.target.value) ?? null;
                    setCandidatos((prev) => ({ ...prev, seleccionado: elegido }));
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Seleccioná con quién intercambiar</option>
                  {candidatos.lista.map((c) => (
                    <option key={claveCandidato(c)} value={claveCandidato(c)}>
                      {c.usuario.apellido_usuario}, {c.usuario.nombre_usuario} — proviene de{' '}
                      {nombreComisionCandidato(c.comision)}
                    </option>
                  ))}
                </select>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Solo se muestran alumnos con inscripción activa en otras comisiones de la misma
                materia que la comisión origen.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!puedeSimular || cargando}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simular matching
        </button>
      </form>

      {cargando && (
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30 overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  Procesando intercambio
                </h3>
                <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
                  {tiempoTranscurrido < 60
                    ? `${tiempoTranscurrido}s transcurridos`
                    : `${Math.floor(tiempoTranscurrido / 60)}m ${tiempoTranscurrido % 60}s transcurridos`}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              El sistema está creando el intercambio, generando el comprobante PDF y enviando las
              notificaciones por email a los alumnos y profesores involucrados. Este proceso puede
              tardar hasta 90 segundos debido a los reintentos automáticos de envío.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  1
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Creando intercambio en base de datos
                </span>
                {tiempoTranscurrido > 0 && (
                  <svg className="h-4 w-4 text-green-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  2
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Generando comprobante PDF
                </span>
                {tiempoTranscurrido > 15 && (
                  <svg className="h-4 w-4 text-green-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  tiempoTranscurrido > 15
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  3
                </span>
                <span className={tiempoTranscurrido > 15 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}>
                  Enviando emails a alumnos
                </span>
                {tiempoTranscurrido > 15 && (
                  <span className="ml-auto flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-indigo-400 opacity-20" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  tiempoTranscurrido > 25
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  4
                </span>
                <span className={tiempoTranscurrido > 25 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}>
                  Notificando a profesores
                </span>
                {tiempoTranscurrido > 25 && (
                  <span className="ml-auto flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-indigo-400 opacity-20" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-1 bg-indigo-100 dark:bg-indigo-900/30">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min((tiempoTranscurrido / 80) * 100, 95)}%` }}
            />
          </div>
        </div>
      )}

      {resultado && (
        <div
          className={`mt-6 rounded-lg px-4 py-3 text-sm ${
            resultado.exito
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
          }`}
        >
          <p className="font-medium">{resultado.mensaje}</p>
        </div>
      )}
    </div>
  );
}
