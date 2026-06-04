'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { usuarioServicio } from '@/servicios/usuarioServicio';
import { matchingServicio } from '@/servicios/matchingServicio';
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

function nombreComision(c: Comision): string {
  if (c.nombre_comision) return c.nombre_comision;
  if (c.numero_comision != null) return `Com. ${c.numero_comision}`;
  return c.materia.nombre_materia;
}

export default function SimularMatchingPage() {
  const { token } = useAuth();

  const [solicitante, setSolicitante] = useState<SelectorState>(estadoInicial);
  const [receptor, setReceptor] = useState<SelectorState>(estadoInicial);

  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<{ exito: boolean; mensaje: string } | null>(null);

  const refSolicitante = useRef<HTMLDivElement>(null);
  const refReceptor = useRef<HTMLDivElement>(null);
  const timerSolicitante = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerReceptor = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar dropdowns al clickear fuera
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (refSolicitante.current && !refSolicitante.current.contains(e.target as Node)) {
        setSolicitante((prev) => ({ ...prev, dropdownAbierto: false }));
      }
      if (refReceptor.current && !refReceptor.current.contains(e.target as Node)) {
        setReceptor((prev) => ({ ...prev, dropdownAbierto: false }));
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const cargarComisiones = useCallback(
    async (
      idUsuario: number,
      setter: React.Dispatch<React.SetStateAction<SelectorState>>,
    ) => {
      setter((prev) => ({ ...prev, cargandoComisiones: true, comisiones: [] }));
      try {
        const comisiones = await usuarioServicio.obtenerComisiones(idUsuario, token ?? undefined);
        setter((prev) => ({ ...prev, comisiones, cargandoComisiones: false }));
      } catch {
        setter((prev) => ({ ...prev, comisiones: [], cargandoComisiones: false }));
      }
    },
    [token],
  );

  const handleQueryChange = useCallback(
    (
      valor: string,
      setter: React.Dispatch<React.SetStateAction<SelectorState>>,
      timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    ) => {
      setter((prev) => ({
        ...prev,
        query: valor,
        dropdownAbierto: valor.length >= 3,
        usuarioSeleccionado: null,
        comisiones: [],
        comisionSeleccionadaId: null,
      }));

      if (timerRef.current) clearTimeout(timerRef.current);

      if (valor.length < 3) {
        setter((prev) => ({ ...prev, resultados: [], buscando: false }));
        return;
      }

      setter((prev) => ({ ...prev, buscando: true }));

      timerRef.current = setTimeout(async () => {
        try {
          const resultados = await usuarioServicio.buscarParaMensajeria(
            valor,
            undefined,
            token ?? undefined,
          );
          setter((prev) => ({ ...prev, resultados, buscando: false, dropdownAbierto: true }));
        } catch {
          setter((prev) => ({ ...prev, resultados: [], buscando: false }));
        }
      }, 350);
    },
    [token],
  );

  const handleSeleccionar = useCallback(
    (
      usuario: UsuarioBusquedaPorDni,
      setter: React.Dispatch<React.SetStateAction<SelectorState>>,
    ) => {
      const seleccionado: UsuarioSeleccionado = {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        apellido_usuario: usuario.apellido_usuario,
      };
      setter((prev) => ({
        ...prev,
        usuarioSeleccionado: seleccionado,
        dropdownAbierto: false,
        resultados: [],
        comisionSeleccionadaId: null,
      }));
      cargarComisiones(usuario.id_usuario, setter);
    },
    [cargarComisiones],
  );

  const handleDeseleccionar = useCallback(
    (setter: React.Dispatch<React.SetStateAction<SelectorState>>) => {
      setter(estadoInicial);
    },
    [],
  );

  const puedeSimular =
    solicitante.usuarioSeleccionado !== null &&
    solicitante.comisionSeleccionadaId !== null &&
    receptor.usuarioSeleccionado !== null &&
    receptor.comisionSeleccionadaId !== null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!puedeSimular) return;

    setCargando(true);
    setResultado(null);

    try {
      const respuesta = await matchingServicio.simular(
        {
          usuarioSolicitanteId: solicitante.usuarioSeleccionado!.id_usuario,
          usuarioReceptorId: receptor.usuarioSeleccionado!.id_usuario,
          comisionOrigenId: solicitante.comisionSeleccionadaId!,
          comisionDestinoId: receptor.comisionSeleccionadaId!,
        },
        token ?? undefined,
      );
      setResultado({ exito: true, mensaje: respuesta.message });
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      setResultado({ exito: false, mensaje });
    } finally {
      setCargando(false);
    }
  }

  function renderSelector(
    label: string,
    labelComision: string,
    state: SelectorState,
    setter: React.Dispatch<React.SetStateAction<SelectorState>>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  ) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>

          {state.usuarioSeleccionado ? (
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 bg-gray-50">
              <span className="flex-1 text-gray-900 dark:text-gray-100">
                {state.usuarioSeleccionado.apellido_usuario},{' '}
                {state.usuarioSeleccionado.nombre_usuario}
              </span>
              <button
                type="button"
                onClick={() => handleDeseleccionar(setter)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 leading-none"
                aria-label="Deseleccionar usuario"
              >
                ✕
              </button>
            </div>
          ) : (
            <div ref={containerRef} className="relative">
              <input
                type="text"
                value={state.query}
                onChange={(e) => handleQueryChange(e.target.value, setter, timerRef)}
                onFocus={() => {
                  if (state.resultados.length > 0) {
                    setter((prev) => ({ ...prev, dropdownAbierto: true }));
                  }
                }}
                placeholder="Buscar por nombre..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />

              {state.dropdownAbierto && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {state.buscando ? (
                    <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Buscando...
                    </li>
                  ) : state.resultados.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Sin resultados
                    </li>
                  ) : (
                    state.resultados.map((u) => (
                      <li
                        key={u.id_usuario}
                        onClick={() => handleSeleccionar(u, setter)}
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
            {labelComision}
          </label>

          {!state.usuarioSeleccionado ? (
            <select
              disabled
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 opacity-50 cursor-not-allowed"
            >
              <option>Seleccioná un usuario primero</option>
            </select>
          ) : state.cargandoComisiones ? (
            <select
              disabled
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 opacity-50 cursor-not-allowed"
            >
              <option>Cargando comisiones...</option>
            </select>
          ) : state.comisiones.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              Este usuario no tiene comisiones activas
            </p>
          ) : (
            <select
              value={state.comisionSeleccionadaId ?? ''}
              onChange={(e) =>
                setter((prev) => ({
                  ...prev,
                  comisionSeleccionadaId: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Seleccioná una comisión</option>
              {state.comisiones.map((c) => (
                <option key={c.id_comision} value={c.id_comision}>
                  {nombreComision(c)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
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
          {renderSelector(
            'Usuario Solicitante',
            'Comisión Origen',
            solicitante,
            setSolicitante,
            refSolicitante,
            timerSolicitante,
          )}
          {renderSelector(
            'Usuario Receptor',
            'Comisión Destino',
            receptor,
            setReceptor,
            refReceptor,
            timerReceptor,
          )}
        </div>

        <button
          type="submit"
          disabled={!puedeSimular || cargando}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? 'Simulando...' : 'Simular matching'}
        </button>
      </form>

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
