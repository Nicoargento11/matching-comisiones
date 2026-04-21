-- CreateEnum
CREATE TYPE "FormatoClase" AS ENUM ('TEORICO', 'PRACTICO', 'TEORICO_PRACTICO');

-- AlterTable
ALTER TABLE "horario_comision" ADD COLUMN     "formato" "FormatoClase" NOT NULL DEFAULT 'TEORICO_PRACTICO';