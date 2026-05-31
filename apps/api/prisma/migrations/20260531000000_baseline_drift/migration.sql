-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVO', 'BAJA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('SISTEMA', 'MATCHING_COMISION');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CLASE', 'PARCIAL', 'ENTREGA_TP', 'OTRO');

-- CreateEnum
CREATE TYPE "OrigenEvento" AS ENUM ('PROFESOR', 'ALUMNO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "CanalRecordatorio" AS ENUM ('APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "FormatoClase" AS ENUM ('TEORICO', 'PRACTICO', 'TEORICO_PRACTICO');

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "dni" INTEGER NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "apellido_usuario" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supabase_auth_id" UUID,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" TEXT NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "rol_usuario" (
    "id_usuario" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "rol_usuario_pkey" PRIMARY KEY ("id_usuario","id_rol")
);

-- CreateTable
CREATE TABLE "facultad" (
    "id_facultad" SERIAL NOT NULL,
    "nombre_facultad" TEXT NOT NULL,

    CONSTRAINT "facultad_pkey" PRIMARY KEY ("id_facultad")
);

-- CreateTable
CREATE TABLE "carrera" (
    "id_carrera" SERIAL NOT NULL,
    "nombre_carrera" TEXT NOT NULL,
    "id_facultad" INTEGER NOT NULL,

    CONSTRAINT "carrera_pkey" PRIMARY KEY ("id_carrera")
);

-- CreateTable
CREATE TABLE "materia" (
    "id_materia" SERIAL NOT NULL,
    "nombre_materia" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "id_carrera" INTEGER NOT NULL,

    CONSTRAINT "materia_pkey" PRIMARY KEY ("id_materia")
);

-- CreateTable
CREATE TABLE "comision" (
    "id_comision" SERIAL NOT NULL,
    "numero_comision" INTEGER,
    "nombre_comision" TEXT,
    "cupo_maximo" INTEGER NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "id_usuario_profesor" INTEGER NOT NULL,
    "id_materia" INTEGER NOT NULL,

    CONSTRAINT "comision_pkey" PRIMARY KEY ("id_comision")
);

-- CreateTable
CREATE TABLE "usuario_comision" (
    "id_usuario" INTEGER NOT NULL,
    "id_comision" INTEGER NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "usuario_comision_pkey" PRIMARY KEY ("id_usuario","id_comision")
);

-- CreateTable
CREATE TABLE "estado" (
    "id_estado" SERIAL NOT NULL,
    "nombre_estado" TEXT NOT NULL,

    CONSTRAINT "estado_pkey" PRIMARY KEY ("id_estado")
);

-- CreateTable
CREATE TABLE "intercambio" (
    "id_intercambio" SERIAL NOT NULL,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_estado" INTEGER NOT NULL,
    "id_usuario_ofrece" INTEGER NOT NULL,
    "id_comision_ofrece" INTEGER NOT NULL,
    "id_usuario_destino" INTEGER NOT NULL,
    "id_comision_destino" INTEGER NOT NULL,

    CONSTRAINT "intercambio_pkey" PRIMARY KEY ("id_intercambio")
);

-- CreateTable
CREATE TABLE "dia" (
    "numero_dia" INTEGER NOT NULL,
    "nombre_dia" TEXT NOT NULL,

    CONSTRAINT "dia_pkey" PRIMARY KEY ("numero_dia")
);

-- CreateTable
CREATE TABLE "modalidad" (
    "id_modalidad" SERIAL NOT NULL,
    "nombre_modalidad" TEXT NOT NULL,

    CONSTRAINT "modalidad_pkey" PRIMARY KEY ("id_modalidad")
);

-- CreateTable
CREATE TABLE "aula" (
    "id_aula" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER,

    CONSTRAINT "aula_pkey" PRIMARY KEY ("id_aula")
);

-- CreateTable
CREATE TABLE "horario_comision" (
    "id_horario_comision" SERIAL NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "id_comision" INTEGER NOT NULL,
    "numero_dia" INTEGER NOT NULL,
    "id_modalidad" INTEGER NOT NULL,
    "id_aula" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "formato" "FormatoClase" NOT NULL DEFAULT 'TEORICO_PRACTICO',

    CONSTRAINT "horario_comision_pkey" PRIMARY KEY ("id_horario_comision")
);

-- CreateTable
CREATE TABLE "comprobante" (
    "id_comprobante" SERIAL NOT NULL,
    "fecha_generacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivo_pdf_url" TEXT NOT NULL,
    "id_intercambio" INTEGER NOT NULL,

    CONSTRAINT "comprobante_pkey" PRIMARY KEY ("id_comprobante")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id_notificacion" SERIAL NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datos" JSONB,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "evento" (
    "id_evento" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_evento" "TipoEvento" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "origen" "OrigenEvento" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "id_usuario" INTEGER NOT NULL,
    "id_materia" INTEGER NOT NULL,
    "id_comision" INTEGER NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "columna_tablero" (
    "id_columna" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden_columna" INTEGER NOT NULL,

    CONSTRAINT "columna_tablero_pkey" PRIMARY KEY ("id_columna")
);

-- CreateTable
CREATE TABLE "tarea" (
    "id_tarea" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" "PrioridadTarea" NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "estimacion_min" INTEGER,
    "id_usuario" INTEGER NOT NULL,
    "id_columna" INTEGER NOT NULL,
    "id_evento" INTEGER,
    "id_materia" INTEGER,

    CONSTRAINT "tarea_pkey" PRIMARY KEY ("id_tarea")
);

-- CreateTable
CREATE TABLE "conversacion" (
    "id_conversacion" SERIAL NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversacion_pkey" PRIMARY KEY ("id_conversacion")
);

-- CreateTable
CREATE TABLE "conversacion_participante" (
    "id_conversacion" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "ultimo_leido" TIMESTAMP(3),

    CONSTRAINT "conversacion_participante_pkey" PRIMARY KEY ("id_conversacion","id_usuario")
);

-- CreateTable
CREATE TABLE "mensaje" (
    "id_mensaje" SERIAL NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_conversacion" INTEGER NOT NULL,
    "id_usuario_emisor" INTEGER NOT NULL,

    CONSTRAINT "mensaje_pkey" PRIMARY KEY ("id_mensaje")
);

-- CreateTable
CREATE TABLE "recordatorio_evento" (
    "id_recordatorio" SERIAL NOT NULL,
    "minutos_antes" INTEGER NOT NULL,
    "canal" "CanalRecordatorio" NOT NULL,
    "id_evento" INTEGER NOT NULL,

    CONSTRAINT "recordatorio_evento_pkey" PRIMARY KEY ("id_recordatorio")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_dni_key" ON "usuario"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_supabase_auth_id_key" ON "usuario"("supabase_auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_rol_key" ON "rol"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "facultad_nombre_facultad_key" ON "facultad"("nombre_facultad");

-- CreateIndex
CREATE UNIQUE INDEX "carrera_nombre_carrera_id_facultad_key" ON "carrera"("nombre_carrera", "id_facultad");

-- CreateIndex
CREATE UNIQUE INDEX "materia_nombre_materia_id_carrera_key" ON "materia"("nombre_materia", "id_carrera");

-- CreateIndex
CREATE UNIQUE INDEX "estado_nombre_estado_key" ON "estado"("nombre_estado");

-- CreateIndex
CREATE INDEX "intercambio_id_estado_idx" ON "intercambio"("id_estado");

-- CreateIndex
CREATE INDEX "intercambio_id_usuario_ofrece_id_comision_ofrece_idx" ON "intercambio"("id_usuario_ofrece", "id_comision_ofrece");

-- CreateIndex
CREATE INDEX "intercambio_id_usuario_destino_id_comision_destino_idx" ON "intercambio"("id_usuario_destino", "id_comision_destino");

-- CreateIndex
CREATE UNIQUE INDEX "dia_nombre_dia_key" ON "dia"("nombre_dia");

-- CreateIndex
CREATE UNIQUE INDEX "modalidad_nombre_modalidad_key" ON "modalidad"("nombre_modalidad");

-- CreateIndex
CREATE UNIQUE INDEX "aula_nombre_key" ON "aula"("nombre");

-- CreateIndex
CREATE INDEX "horario_comision_id_comision_idx" ON "horario_comision"("id_comision");

-- CreateIndex
CREATE UNIQUE INDEX "comprobante_id_intercambio_key" ON "comprobante"("id_intercambio");

-- CreateIndex
CREATE INDEX "notificacion_id_usuario_leida_idx" ON "notificacion"("id_usuario", "leida");

-- CreateIndex
CREATE INDEX "evento_id_usuario_fecha_inicio_idx" ON "evento"("id_usuario", "fecha_inicio");

-- CreateIndex
CREATE INDEX "evento_id_comision_fecha_inicio_idx" ON "evento"("id_comision", "fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "columna_tablero_nombre_orden_columna_key" ON "columna_tablero"("nombre", "orden_columna");

-- CreateIndex
CREATE INDEX "tarea_id_usuario_fecha_vencimiento_idx" ON "tarea"("id_usuario", "fecha_vencimiento");

-- CreateIndex
CREATE INDEX "mensaje_id_conversacion_creado_en_idx" ON "mensaje"("id_conversacion", "creado_en");

-- CreateIndex
CREATE INDEX "recordatorio_evento_id_evento_idx" ON "recordatorio_evento"("id_evento");

-- AddForeignKey
ALTER TABLE "rol_usuario" ADD CONSTRAINT "rol_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_usuario" ADD CONSTRAINT "rol_usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrera" ADD CONSTRAINT "carrera_id_facultad_fkey" FOREIGN KEY ("id_facultad") REFERENCES "facultad"("id_facultad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materia" ADD CONSTRAINT "materia_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id_carrera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comision" ADD CONSTRAINT "comision_id_usuario_profesor_fkey" FOREIGN KEY ("id_usuario_profesor") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comision" ADD CONSTRAINT "comision_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_comision" ADD CONSTRAINT "usuario_comision_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_comision" ADD CONSTRAINT "usuario_comision_id_comision_fkey" FOREIGN KEY ("id_comision") REFERENCES "comision"("id_comision") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercambio" ADD CONSTRAINT "intercambio_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "estado"("id_estado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercambio" ADD CONSTRAINT "intercambio_id_usuario_ofrece_id_comision_ofrece_fkey" FOREIGN KEY ("id_usuario_ofrece", "id_comision_ofrece") REFERENCES "usuario_comision"("id_usuario", "id_comision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercambio" ADD CONSTRAINT "intercambio_id_usuario_destino_id_comision_destino_fkey" FOREIGN KEY ("id_usuario_destino", "id_comision_destino") REFERENCES "usuario_comision"("id_usuario", "id_comision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_comision" ADD CONSTRAINT "horario_comision_id_comision_fkey" FOREIGN KEY ("id_comision") REFERENCES "comision"("id_comision") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_comision" ADD CONSTRAINT "horario_comision_numero_dia_fkey" FOREIGN KEY ("numero_dia") REFERENCES "dia"("numero_dia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_comision" ADD CONSTRAINT "horario_comision_id_modalidad_fkey" FOREIGN KEY ("id_modalidad") REFERENCES "modalidad"("id_modalidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_comision" ADD CONSTRAINT "horario_comision_id_aula_fkey" FOREIGN KEY ("id_aula") REFERENCES "aula"("id_aula") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_id_intercambio_fkey" FOREIGN KEY ("id_intercambio") REFERENCES "intercambio"("id_intercambio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_comision_fkey" FOREIGN KEY ("id_comision") REFERENCES "comision"("id_comision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_id_columna_fkey" FOREIGN KEY ("id_columna") REFERENCES "columna_tablero"("id_columna") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversacion_participante" ADD CONSTRAINT "conversacion_participante_id_conversacion_fkey" FOREIGN KEY ("id_conversacion") REFERENCES "conversacion"("id_conversacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversacion_participante" ADD CONSTRAINT "conversacion_participante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_conversacion_fkey" FOREIGN KEY ("id_conversacion") REFERENCES "conversacion"("id_conversacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_usuario_emisor_fkey" FOREIGN KEY ("id_usuario_emisor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorio_evento" ADD CONSTRAINT "recordatorio_evento_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE CASCADE ON UPDATE CASCADE;
