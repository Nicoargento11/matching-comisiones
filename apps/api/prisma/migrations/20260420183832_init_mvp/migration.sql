-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVO', 'BAJA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('SISTEMA', 'INTERCAMBIO', 'COMPROBANTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "dni" INTEGER NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "apellido_usuario" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supabase_auth_id" UUID,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" TEXT NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "Rol_usuario" (
    "id_usuario" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "Rol_usuario_pkey" PRIMARY KEY ("id_usuario","id_rol")
);

-- CreateTable
CREATE TABLE "Facultad" (
    "id_facultad" SERIAL NOT NULL,
    "nombre_facultad" TEXT NOT NULL,

    CONSTRAINT "Facultad_pkey" PRIMARY KEY ("id_facultad")
);

-- CreateTable
CREATE TABLE "carrera" (
    "id_carrera" SERIAL NOT NULL,
    "nombre_carrera" TEXT NOT NULL,
    "id_facultad" INTEGER NOT NULL,

    CONSTRAINT "carrera_pkey" PRIMARY KEY ("id_carrera")
);

-- CreateTable
CREATE TABLE "Materia" (
    "id_materia" SERIAL NOT NULL,
    "nombre_materia" TEXT NOT NULL,
    "id_carrera" INTEGER NOT NULL,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id_materia")
);

-- CreateTable
CREATE TABLE "profesor" (
    "id_profesor" SERIAL NOT NULL,
    "nombre_profesor" TEXT NOT NULL,

    CONSTRAINT "profesor_pkey" PRIMARY KEY ("id_profesor")
);

-- CreateTable
CREATE TABLE "Comision" (
    "id_comision" SERIAL NOT NULL,
    "numero_comision" INTEGER,
    "nombre_comision" TEXT,
    "cupo_maximo" INTEGER NOT NULL,
    "id_profesor" INTEGER NOT NULL,
    "id_materia" INTEGER NOT NULL,

    CONSTRAINT "Comision_pkey" PRIMARY KEY ("id_comision")
);

-- CreateTable
CREATE TABLE "Usuario_comision" (
    "id_usuario" INTEGER NOT NULL,
    "id_comision" INTEGER NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Usuario_comision_pkey" PRIMARY KEY ("id_usuario","id_comision")
);

-- CreateTable
CREATE TABLE "Estado" (
    "id_estado" SERIAL NOT NULL,
    "nombre_estado" TEXT NOT NULL,

    CONSTRAINT "Estado_pkey" PRIMARY KEY ("id_estado")
);

-- CreateTable
CREATE TABLE "Intercambio" (
    "id_intercambio" SERIAL NOT NULL,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_estado" INTEGER NOT NULL,
    "id_usuario_ofrece" INTEGER NOT NULL,
    "id_comision_ofrece" INTEGER NOT NULL,
    "id_usuario_destino" INTEGER NOT NULL,
    "id_comision_destino" INTEGER NOT NULL,

    CONSTRAINT "Intercambio_pkey" PRIMARY KEY ("id_intercambio")
);

-- CreateTable
CREATE TABLE "Dia" (
    "numero_dia" INTEGER NOT NULL,
    "nombre_dia" TEXT NOT NULL,

    CONSTRAINT "Dia_pkey" PRIMARY KEY ("numero_dia")
);

-- CreateTable
CREATE TABLE "Modalidad" (
    "id_modalidad" SERIAL NOT NULL,
    "nombre_modalidad" TEXT NOT NULL,

    CONSTRAINT "Modalidad_pkey" PRIMARY KEY ("id_modalidad")
);

-- CreateTable
CREATE TABLE "Horario_comision" (
    "id_horario_comision" SERIAL NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "id_comision" INTEGER NOT NULL,
    "numero_dia" INTEGER NOT NULL,
    "id_modalidad" INTEGER NOT NULL,

    CONSTRAINT "Horario_comision_pkey" PRIMARY KEY ("id_horario_comision")
);

-- CreateTable
CREATE TABLE "Comprobante" (
    "id_comprobante" SERIAL NOT NULL,
    "fecha_generacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivo_pdf_url" TEXT NOT NULL,
    "id_intercambio" INTEGER NOT NULL,

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("id_comprobante")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id_notificacion" SERIAL NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario" INTEGER NOT NULL,
    "id_comprobante" INTEGER,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_supabase_auth_id_key" ON "Usuario"("supabase_auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_rol_key" ON "Rol"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "Facultad_nombre_facultad_key" ON "Facultad"("nombre_facultad");

-- CreateIndex
CREATE UNIQUE INDEX "carrera_nombre_carrera_id_facultad_key" ON "carrera"("nombre_carrera", "id_facultad");

-- CreateIndex
CREATE UNIQUE INDEX "Materia_nombre_materia_id_carrera_key" ON "Materia"("nombre_materia", "id_carrera");

-- CreateIndex
CREATE UNIQUE INDEX "Estado_nombre_estado_key" ON "Estado"("nombre_estado");

-- CreateIndex
CREATE INDEX "Intercambio_id_estado_idx" ON "Intercambio"("id_estado");

-- CreateIndex
CREATE INDEX "Intercambio_id_usuario_ofrece_id_comision_ofrece_idx" ON "Intercambio"("id_usuario_ofrece", "id_comision_ofrece");

-- CreateIndex
CREATE INDEX "Intercambio_id_usuario_destino_id_comision_destino_idx" ON "Intercambio"("id_usuario_destino", "id_comision_destino");

-- CreateIndex
CREATE UNIQUE INDEX "Dia_nombre_dia_key" ON "Dia"("nombre_dia");

-- CreateIndex
CREATE UNIQUE INDEX "Modalidad_nombre_modalidad_key" ON "Modalidad"("nombre_modalidad");

-- CreateIndex
CREATE INDEX "Horario_comision_id_comision_idx" ON "Horario_comision"("id_comision");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_id_intercambio_key" ON "Comprobante"("id_intercambio");

-- CreateIndex
CREATE INDEX "Notificacion_id_usuario_leida_idx" ON "Notificacion"("id_usuario", "leida");

-- AddForeignKey
ALTER TABLE "Rol_usuario" ADD CONSTRAINT "Rol_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rol_usuario" ADD CONSTRAINT "Rol_usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol"("id_rol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrera" ADD CONSTRAINT "carrera_id_facultad_fkey" FOREIGN KEY ("id_facultad") REFERENCES "Facultad"("id_facultad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id_carrera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "profesor"("id_profesor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "Materia"("id_materia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario_comision" ADD CONSTRAINT "Usuario_comision_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario_comision" ADD CONSTRAINT "Usuario_comision_id_comision_fkey" FOREIGN KEY ("id_comision") REFERENCES "Comision"("id_comision") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intercambio" ADD CONSTRAINT "Intercambio_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "Estado"("id_estado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intercambio" ADD CONSTRAINT "Intercambio_id_usuario_ofrece_id_comision_ofrece_fkey" FOREIGN KEY ("id_usuario_ofrece", "id_comision_ofrece") REFERENCES "Usuario_comision"("id_usuario", "id_comision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intercambio" ADD CONSTRAINT "Intercambio_id_usuario_destino_id_comision_destino_fkey" FOREIGN KEY ("id_usuario_destino", "id_comision_destino") REFERENCES "Usuario_comision"("id_usuario", "id_comision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario_comision" ADD CONSTRAINT "Horario_comision_id_comision_fkey" FOREIGN KEY ("id_comision") REFERENCES "Comision"("id_comision") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario_comision" ADD CONSTRAINT "Horario_comision_numero_dia_fkey" FOREIGN KEY ("numero_dia") REFERENCES "Dia"("numero_dia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario_comision" ADD CONSTRAINT "Horario_comision_id_modalidad_fkey" FOREIGN KEY ("id_modalidad") REFERENCES "Modalidad"("id_modalidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_id_intercambio_fkey" FOREIGN KEY ("id_intercambio") REFERENCES "Intercambio"("id_intercambio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_id_comprobante_fkey" FOREIGN KEY ("id_comprobante") REFERENCES "Comprobante"("id_comprobante") ON DELETE SET NULL ON UPDATE CASCADE;
