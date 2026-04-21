-- AlterTable
ALTER TABLE "comision" ADD COLUMN     "fecha_fin" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "horario_comision" ADD COLUMN     "id_aula" INTEGER;

-- CreateTable
CREATE TABLE "aula" (
    "id_aula" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER,

    CONSTRAINT "aula_pkey" PRIMARY KEY ("id_aula")
);

-- CreateIndex
CREATE UNIQUE INDEX "aula_nombre_key" ON "aula"("nombre");

-- AddForeignKey
ALTER TABLE "horario_comision" ADD CONSTRAINT "horario_comision_id_aula_fkey" FOREIGN KEY ("id_aula") REFERENCES "aula"("id_aula") ON DELETE SET NULL ON UPDATE CASCADE;
