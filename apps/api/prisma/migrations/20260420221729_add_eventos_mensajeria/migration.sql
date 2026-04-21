-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CLASE', 'PARCIAL', 'ENTREGA_TP', 'OTRO');

-- CreateEnum
CREATE TYPE "OrigenEvento" AS ENUM ('PROFESOR', 'ALUMNO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "CanalRecordatorio" AS ENUM ('APP', 'EMAIL');

-- CreateTable
CREATE TABLE "evento" (
    "id_evento" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_evento" "TipoEvento" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "origen" "OrigenEvento" NOT NULL,
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
