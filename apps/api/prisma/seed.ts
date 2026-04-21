import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpiar/Crear Roles
  const rolEstudiante = await prisma.rol.upsert({
    where: { nombre_rol: 'estudiante' },
    update: {},
    create: { nombre_rol: 'estudiante' },
  });
  
  const rolProfesor = await prisma.rol.upsert({
    where: { nombre_rol: 'profesor' },
    update: {},
    create: { nombre_rol: 'profesor' },
  });

  // Limpiar/Crear Usuarios (Fijos para 1 y 2)
  const alumno = await prisma.usuario.upsert({
    where: { correo: 'alumno@sic.com' },
    update: {},
    create: {
      id_usuario: 1,
      dni: 40123456,
      nombre_usuario: 'Juan',
      apellido_usuario: 'Pérez',
      correo: 'alumno@sic.com',
      contrasena: '12345',
    },
  });

  const profesor = await prisma.usuario.upsert({
    where: { correo: 'profesor@sic.com' },
    update: {},
    create: {
      id_usuario: 2,
      dni: 20123456,
      nombre_usuario: 'Mario',
      apellido_usuario: 'Gómez',
      correo: 'profesor@sic.com',
      contrasena: '12345',
    },
  });

  // RolUsuarios
  await prisma.rolUsuario.upsert({
    where: { id_usuario_id_rol: { id_usuario: alumno.id_usuario, id_rol: rolEstudiante.id_rol } },
    update: {},
    create: { id_usuario: alumno.id_usuario, id_rol: rolEstudiante.id_rol },
  });
  await prisma.rolUsuario.upsert({
    where: { id_usuario_id_rol: { id_usuario: profesor.id_usuario, id_rol: rolProfesor.id_rol } },
    update: {},
    create: { id_usuario: profesor.id_usuario, id_rol: rolProfesor.id_rol },
  });

  // Datos Académicos
  const facultad = await prisma.facultad.upsert({
    where: { nombre_facultad: 'Ingeniería' },
    update: {},
    create: { nombre_facultad: 'Ingeniería' },
  });

  const carrera = await prisma.carrera.upsert({
    where: { nombre_carrera_id_facultad: { nombre_carrera: 'Ingeniería en Sistemas', id_facultad: facultad.id_facultad } },
    update: {},
    create: { nombre_carrera: 'Ingeniería en Sistemas', id_facultad: facultad.id_facultad },
  });

  const materia = await prisma.materia.upsert({
    where: { nombre_materia_id_carrera: { nombre_materia: 'Ingeniería de Software 2', id_carrera: carrera.id_carrera } },
    update: {},
    create: { nombre_materia: 'Ingeniería de Software 2', id_carrera: carrera.id_carrera },
  });

  const comision = await prisma.comision.upsert({
    where: { id_comision: 1 },
    update: { id_usuario_profesor: profesor.id_usuario },
    create: {
      id_comision: 1,
      numero_comision: 101,
      nombre_comision: 'Comisión 101 MA',
      cupo_maximo: 50,
      id_materia: materia.id_materia,
      id_usuario_profesor: profesor.id_usuario,
    },
  });

  const dia = await prisma.dia.upsert({
    where: { nombre_dia: 'Lunes' },
    update: {},
    create: { numero_dia: 1, nombre_dia: 'Lunes' },
  });

  const modalidad = await prisma.modalidad.upsert({
    where: { nombre_modalidad: 'PRESENCIAL' },
    update: {},
    create: { nombre_modalidad: 'PRESENCIAL' },
  });

  const aula = await prisma.aula.upsert({
    where: { nombre: 'Aula 10' },
    update: {},
    create: { nombre: 'Aula 10', capacidad: 50 },
  });

  await prisma.horarioComision.create({
    data: {
      hora_inicio: '18:00',
      hora_fin: '22:00',
      id_comision: comision.id_comision,
      numero_dia: dia.numero_dia,
      id_modalidad: modalidad.id_modalidad,
      id_aula: aula.id_aula,
      formato: 'TEORICO_PRACTICO',
    },
  });

  await prisma.usuarioComision.upsert({
    where: { id_usuario_id_comision: { id_usuario: alumno.id_usuario, id_comision: comision.id_comision } },
    update: {},
    create: { id_usuario: alumno.id_usuario, id_comision: comision.id_comision, estado: 'ACTIVO' },
  });

  console.log('Seed exitoso');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
