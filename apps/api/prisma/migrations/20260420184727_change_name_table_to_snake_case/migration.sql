/*
  Warnings:

  - You are about to drop the `Comision` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comprobante` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Dia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Estado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Facultad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Horario_comision` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Intercambio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Materia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Modalidad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notificacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rol` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rol_usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario_comision` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comision" DROP CONSTRAINT "Comision_id_materia_fkey";

-- DropForeignKey
ALTER TABLE "Comision" DROP CONSTRAINT "Comision_id_profesor_fkey";

-- DropForeignKey
ALTER TABLE "Comprobante" DROP CONSTRAINT "Comprobante_id_intercambio_fkey";

-- DropForeignKey
ALTER TABLE "Horario_comision" DROP CONSTRAINT "Horario_comision_id_comision_fkey";

-- DropForeignKey
ALTER TABLE "Horario_comision" DROP CONSTRAINT "Horario_comision_id_modalidad_fkey";

-- DropForeignKey
ALTER TABLE "Horario_comision" DROP CONSTRAINT "Horario_comision_numero_dia_fkey";

-- DropForeignKey
ALTER TABLE "Intercambio" DROP CONSTRAINT "Intercambio_id_estado_fkey";

-- DropForeignKey
ALTER TABLE "Intercambio" DROP CONSTRAINT "Intercambio_id_usuario_destino_id_comision_destino_fkey";

-- DropForeignKey
ALTER TABLE "Intercambio" DROP CONSTRAINT "Intercambio_id_usuario_ofrece_id_comision_ofrece_fkey";

-- DropForeignKey
ALTER TABLE "Materia" DROP CONSTRAINT "Materia_id_carrera_fkey";

-- DropForeignKey
ALTER TABLE "Notificacion" DROP CONSTRAINT "Notificacion_id_comprobante_fkey";

-- DropForeignKey
ALTER TABLE "Notificacion" DROP CONSTRAINT "Notificacion_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "Rol_usuario" DROP CONSTRAINT "Rol_usuario_id_rol_fkey";

-- DropForeignKey
ALTER TABLE "Rol_usuario" DROP CONSTRAINT "Rol_usuario_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "Usuario_comision" DROP CONSTRAINT "Usuario_comision_id_comision_fkey";

-- DropForeignKey
ALTER TABLE "Usuario_comision" DROP CONSTRAINT "Usuario_comision_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "carrera" DROP CONSTRAINT "carrera_id_facultad_fkey";

-- DropTable
DROP TABLE "Comision";

-- DropTable
DROP TABLE "Comprobante";

-- DropTable
DROP TABLE "Dia";

-- DropTable
DROP TABLE "Estado";

-- DropTable
DROP TABLE "Facultad";

-- DropTable
DROP TABLE "Horario_comision";

-- DropTable
DROP TABLE "Intercambio";

-- DropTable
DROP TABLE "Materia";

-- DropTable
DROP TABLE "Modalidad";

-- DropTable
DROP TABLE "Notificacion";

-- DropTable
DROP TABLE "Rol";

-- DropTable
DROP TABLE "Rol_usuario";

-- DropTable
DROP TABLE "Usuario";

-- DropTable
DROP TABLE "Usuario_comision";

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "dni" INTEGER NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "apellido_usuario" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
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
CREATE TABLE "materia" (
    "id_materia" SERIAL NOT NULL,
    "nombre_materia" TEXT NOT NULL,
    "id_carrera" INTEGER NOT NULL,

    CONSTRAINT "materia_pkey" PRIMARY KEY ("id_materia")
);

-- CreateTable
CREATE TABLE "comision" (
    "id_comision" SERIAL NOT NULL,
    "numero_comision" INTEGER,
    "nombre_comision" TEXT,
    "cupo_maximo" INTEGER NOT NULL,
    "id_profesor" INTEGER NOT NULL,
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
CREATE TABLE "horario_comision" (
    "id_horario_comision" SERIAL NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "id_comision" INTEGER NOT NULL,
    "numero_dia" INTEGER NOT NULL,
    "id_modalidad" INTEGER NOT NULL,

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
    "mensaje" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario" INTEGER NOT NULL,
    "id_comprobante" INTEGER,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id_notificacion")
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
CREATE INDEX "horario_comision_id_comision_idx" ON "horario_comision"("id_comision");

-- CreateIndex
CREATE UNIQUE INDEX "comprobante_id_intercambio_key" ON "comprobante"("id_intercambio");

-- CreateIndex
CREATE INDEX "notificacion_id_usuario_leida_idx" ON "notificacion"("id_usuario", "leida");

-- AddForeignKey
ALTER TABLE "rol_usuario" ADD CONSTRAINT "rol_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_usuario" ADD CONSTRAINT "rol_usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrera" ADD CONSTRAINT "carrera_id_facultad_fkey" FOREIGN KEY ("id_facultad") REFERENCES "facultad"("id_facultad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materia" ADD CONSTRAINT "materia_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id_carrera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comision" ADD CONSTRAINT "comision_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "profesor"("id_profesor") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_id_intercambio_fkey" FOREIGN KEY ("id_intercambio") REFERENCES "intercambio"("id_intercambio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_comprobante_fkey" FOREIGN KEY ("id_comprobante") REFERENCES "comprobante"("id_comprobante") ON DELETE SET NULL ON UPDATE CASCADE;
