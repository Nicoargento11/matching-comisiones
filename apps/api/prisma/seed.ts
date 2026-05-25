import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Crea el usuario en Supabase Auth y devuelve el UUID
async function crearEnAuth(email: string, password: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    // Si ya existe, lo buscamos por email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    const existente = list?.users?.find((u) => u.email === email);
    if (existente) return existente.id;
    throw new Error(`Error creando ${email}: ${error.message}`);
  }
  return data.user.id;
}

// Elimina todos los usuarios del Auth que sean del dominio @sic.com
async function limpiarAuthUsers() {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const usuarios =
    data?.users?.filter((u) => u.email?.endsWith('@sic.com')) ?? [];
  await Promise.all(
    usuarios.map((u) => supabaseAdmin.auth.admin.deleteUser(u.id)),
  );
  console.log(`   Auth: ${usuarios.length} usuarios eliminados`);
}

async function main() {
  console.log('🧹 Limpiando base de datos...');

  // TRUNCATE resetea las secuencias de autoincrement (RESTART IDENTITY).
  // CASCADE maneja automáticamente el orden de dependencias entre tablas.
  await prisma.$executeRaw`
    TRUNCATE TABLE
      recordatorio_evento, tarea, notificacion, comprobante, intercambio,
      mensaje, conversacion_participante, conversacion, evento,
      horario_comision, usuario_comision, rol_usuario, comision,
      usuario, rol, materia, carrera, facultad, estado,
      dia, modalidad, aula, columna_tablero
    RESTART IDENTITY CASCADE
  `;
  await limpiarAuthUsers();

  console.log('🌱 Creando estructura base...');

  // ── ROLES ──────────────────────────────────────────────────────────────────
  const rolEstudiante = await prisma.rol.create({
    data: { nombre_rol: 'estudiante' },
  });
  const rolProfesor = await prisma.rol.create({
    data: { nombre_rol: 'profesor' },
  });

  // ── ACADÉMICO ──────────────────────────────────────────────────────────────
  const facultad = await prisma.facultad.create({
    data: { nombre_facultad: 'Ingeniería' },
  });

  const [carreraIS, carreraInfo] = await Promise.all([
    prisma.carrera.create({
      data: {
        nombre_carrera: 'Ingeniería en Sistemas',
        id_facultad: facultad.id_facultad,
      },
    }),
    prisma.carrera.create({
      data: {
        nombre_carrera: 'Licenciatura en Informática',
        id_facultad: facultad.id_facultad,
      },
    }),
  ]);

  const [
    materiaIS2,
    materiaMD,
    materiaArq,
    materiaBD,
    materiaSO,
    materiaRedes,
  ] = await Promise.all([
    prisma.materia.create({
      data: {
        nombre_materia: 'Ingeniería de Software 2',
        id_carrera: carreraIS.id_carrera,
      },
    }),
    prisma.materia.create({
      data: {
        nombre_materia: 'Matemática Discreta',
        id_carrera: carreraIS.id_carrera,
      },
    }),
    prisma.materia.create({
      data: {
        nombre_materia: 'Arquitectura de Computadoras',
        id_carrera: carreraIS.id_carrera,
      },
    }),
    prisma.materia.create({
      data: {
        nombre_materia: 'Base de Datos',
        id_carrera: carreraInfo.id_carrera,
      },
    }),
    prisma.materia.create({
      data: {
        nombre_materia: 'Sistemas Operativos',
        id_carrera: carreraIS.id_carrera,
      },
    }),
    prisma.materia.create({
      data: {
        nombre_materia: 'Redes de Computadoras',
        id_carrera: carreraInfo.id_carrera,
      },
    }),
  ]);

  // ── DÍAS / MODALIDADES / AULAS ─────────────────────────────────────────────
  const [lunes, martes, miercoles, jueves, viernes] = await Promise.all([
    prisma.dia.create({ data: { numero_dia: 1, nombre_dia: 'Lunes' } }),
    prisma.dia.create({ data: { numero_dia: 2, nombre_dia: 'Martes' } }),
    prisma.dia.create({ data: { numero_dia: 3, nombre_dia: 'Miércoles' } }),
    prisma.dia.create({ data: { numero_dia: 4, nombre_dia: 'Jueves' } }),
    prisma.dia.create({ data: { numero_dia: 5, nombre_dia: 'Viernes' } }),
  ]);

  const [presencial, virtual, hibrido] = await Promise.all([
    prisma.modalidad.create({ data: { nombre_modalidad: 'PRESENCIAL' } }),
    prisma.modalidad.create({ data: { nombre_modalidad: 'VIRTUAL' } }),
    prisma.modalidad.create({ data: { nombre_modalidad: 'HÍBRIDO' } }),
  ]);

  const [aula10, aula12, aula20, labSistemas, labRedes] = await Promise.all([
    prisma.aula.create({ data: { nombre: 'Aula 10', capacidad: 50 } }),
    prisma.aula.create({ data: { nombre: 'Aula 12', capacidad: 40 } }),
    prisma.aula.create({ data: { nombre: 'Aula 20', capacidad: 60 } }),
    prisma.aula.create({ data: { nombre: 'Lab. Sistemas', capacidad: 30 } }),
    prisma.aula.create({ data: { nombre: 'Lab. Redes', capacidad: 25 } }),
  ]);

  // ── USUARIOS EN AUTH + DB ──────────────────────────────────────────────────
  console.log('👤 Creando usuarios en Supabase Auth...');

  const datosAlumnos = [
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: 40123456,
      email: 'juan.perez@sic.com',
    },
    {
      nombre: 'María',
      apellido: 'García',
      dni: 41234567,
      email: 'maria.garcia@sic.com',
    },
    {
      nombre: 'Lucas',
      apellido: 'Rodríguez',
      dni: 42345678,
      email: 'lucas.rodriguez@sic.com',
    },
    {
      nombre: 'Sofía',
      apellido: 'López',
      dni: 43456789,
      email: 'sofia.lopez@sic.com',
    },
    {
      nombre: 'Martín',
      apellido: 'Fernández',
      dni: 44567890,
      email: 'martin.fernandez@sic.com',
    },
    {
      nombre: 'Valentina',
      apellido: 'Torres',
      dni: 45678901,
      email: 'valentina.torres@sic.com',
    },
    {
      nombre: 'Nicolás',
      apellido: 'Ramírez',
      dni: 46789012,
      email: 'nicolas.ramirez@sic.com',
    },
    {
      nombre: 'Camila',
      apellido: 'Sánchez',
      dni: 47890123,
      email: 'camila.sanchez@sic.com',
    },
    {
      nombre: 'Facundo',
      apellido: 'Moreno',
      dni: 48901234,
      email: 'facundo.moreno@sic.com',
    },
    {
      nombre: 'Agustina',
      apellido: 'Romero',
      dni: 49012345,
      email: 'agustina.romero@sic.com',
    },
    {
      nombre: 'Tomás',
      apellido: 'Díaz',
      dni: 50123456,
      email: 'tomas.diaz@sic.com',
    },
    {
      nombre: 'Florencia',
      apellido: 'Álvarez',
      dni: 51234567,
      email: 'florencia.alvarez@sic.com',
    },
    {
      nombre: 'Ignacio',
      apellido: 'Ruiz',
      dni: 52345678,
      email: 'ignacio.ruiz@sic.com',
    },
    {
      nombre: 'Luciana',
      apellido: 'Jiménez',
      dni: 53456789,
      email: 'luciana.jimenez@sic.com',
    },
    {
      nombre: 'Sebastián',
      apellido: 'Herrera',
      dni: 54567890,
      email: 'sebastian.herrera@sic.com',
    },
    {
      nombre: 'Micaela',
      apellido: 'Medina',
      dni: 55678901,
      email: 'micaela.medina@sic.com',
    },
    {
      nombre: 'Matías',
      apellido: 'Castro',
      dni: 56789012,
      email: 'matias.castro@sic.com',
    },
    {
      nombre: 'Julieta',
      apellido: 'Ortiz',
      dni: 57890123,
      email: 'julieta.ortiz@sic.com',
    },
    {
      nombre: 'Rodrigo',
      apellido: 'Vargas',
      dni: 58901234,
      email: 'rodrigo.vargas@sic.com',
    },
    {
      nombre: 'Natalia',
      apellido: 'Molina',
      dni: 59012345,
      email: 'natalia.molina@sic.com',
    },
    {
      nombre: 'Ezequiel',
      apellido: 'Silva',
      dni: 60123456,
      email: 'ezequiel.silva@sic.com',
    },
    {
      nombre: 'Rocío',
      apellido: 'Guerrero',
      dni: 61234567,
      email: 'rocio.guerrero@sic.com',
    },
    {
      nombre: 'Leandro',
      apellido: 'Delgado',
      dni: 62345678,
      email: 'leandro.delgado@sic.com',
    },
    {
      nombre: 'Carolina',
      apellido: 'Mendoza',
      dni: 63456789,
      email: 'carolina.mendoza@sic.com',
    },
    {
      nombre: 'Pablo',
      apellido: 'Ibáñez',
      dni: 64567890,
      email: 'pablo.ibanez@sic.com',
    },
    {
      nombre: 'Daniela',
      apellido: 'Vega',
      dni: 65678901,
      email: 'daniela.vega@sic.com',
    },
    {
      nombre: 'Maximiliano',
      apellido: 'Ramos',
      dni: 66789012,
      email: 'maxi.ramos@sic.com',
    },
    {
      nombre: 'Aldana',
      apellido: 'Reyes',
      dni: 67890123,
      email: 'aldana.reyes@sic.com',
    },
    {
      nombre: 'Guido',
      apellido: 'Navarro',
      dni: 68901234,
      email: 'guido.navarro@sic.com',
    },
    {
      nombre: 'Melisa',
      apellido: 'Ríos',
      dni: 69012345,
      email: 'melisa.rios@sic.com',
    },
  ];

  const datosProfesores = [
    {
      nombre: 'Carlos',
      apellido: 'Martínez',
      dni: 20123456,
      email: 'carlos.martinez@sic.com',
    },
    {
      nombre: 'Ana',
      apellido: 'Fernández',
      dni: 21234567,
      email: 'ana.fernandez@sic.com',
    },
    {
      nombre: 'Roberto',
      apellido: 'Silva',
      dni: 22345678,
      email: 'roberto.silva@sic.com',
    },
    {
      nombre: 'Laura',
      apellido: 'Gómez',
      dni: 23456789,
      email: 'laura.gomez@sic.com',
    },
  ];

  // También se puede loguear con alumno@sic.com / profesor@sic.com por compatibilidad
  const compatibilidad = [
    {
      nombre: 'Demo',
      apellido: 'Alumno',
      dni: 40000001,
      email: 'alumno@sic.com',
      esProfesor: false,
    },
    {
      nombre: 'Demo',
      apellido: 'Profesor',
      dni: 20000001,
      email: 'profesor@sic.com',
      esProfesor: true,
    },
  ];

  // Crear alumnos en Auth + DB
  const alumnos = await Promise.all(
    datosAlumnos.map(async (d) => {
      const authId = await crearEnAuth(d.email, 'Password123!');
      return prisma.usuario.create({
        data: {
          dni: d.dni,
          nombre_usuario: d.nombre,
          apellido_usuario: d.apellido,
          correo: d.email,
          supabase_auth_id: authId,
        },
      });
    }),
  );

  // Crear profesores en Auth + DB
  const profesores = await Promise.all(
    datosProfesores.map(async (d) => {
      const authId = await crearEnAuth(d.email, 'Password123!');
      return prisma.usuario.create({
        data: {
          dni: d.dni,
          nombre_usuario: d.nombre,
          apellido_usuario: d.apellido,
          correo: d.email,
          supabase_auth_id: authId,
        },
      });
    }),
  );

  // Crear usuarios de compatibilidad
  const extras = await Promise.all(
    compatibilidad.map(async (d) => {
      const authId = await crearEnAuth(d.email, 'Password123!');
      const u = await prisma.usuario.create({
        data: {
          dni: d.dni,
          nombre_usuario: d.nombre,
          apellido_usuario: d.apellido,
          correo: d.email,
          supabase_auth_id: authId,
        },
      });
      return { usuario: u, esProfesor: d.esProfesor };
    }),
  );

  // Roles
  await prisma.rolUsuario.createMany({
    data: [
      ...alumnos.map((u) => ({
        id_usuario: u.id_usuario,
        id_rol: rolEstudiante.id_rol,
      })),
      ...profesores.map((u) => ({
        id_usuario: u.id_usuario,
        id_rol: rolProfesor.id_rol,
      })),
      ...extras.map(({ usuario, esProfesor }) => ({
        id_usuario: usuario.id_usuario,
        id_rol: esProfesor ? rolProfesor.id_rol : rolEstudiante.id_rol,
      })),
    ],
  });

  const [prof1, prof2, prof3, prof4] = profesores;

  console.log(
    `   ✓ ${alumnos.length} alumnos + ${profesores.length} profesores + ${extras.length} extras`,
  );

  // ── COMISIONES ─────────────────────────────────────────────────────────────
  console.log('📚 Creando comisiones...');

  const comisiones = await Promise.all([
    // IS2: 3 comisiones
    prisma.comision.create({
      data: {
        numero_comision: 1,
        nombre_comision: 'IS2 — Com. 1',
        cupo_maximo: 40,
        id_materia: materiaIS2.id_materia,
        id_usuario_profesor: prof1.id_usuario,
      },
    }),
    prisma.comision.create({
      data: {
        numero_comision: 2,
        nombre_comision: 'IS2 — Com. 2',
        cupo_maximo: 35,
        id_materia: materiaIS2.id_materia,
        id_usuario_profesor: prof2.id_usuario,
      },
    }),
    prisma.comision.create({
      data: {
        numero_comision: 3,
        nombre_comision: 'IS2 — Com. 3',
        cupo_maximo: 30,
        id_materia: materiaIS2.id_materia,
        id_usuario_profesor: prof3.id_usuario,
      },
    }),
    // MD: 2 comisiones
    prisma.comision.create({
      data: {
        numero_comision: 1,
        nombre_comision: 'MD — Com. 1',
        cupo_maximo: 45,
        id_materia: materiaMD.id_materia,
        id_usuario_profesor: prof1.id_usuario,
      },
    }),
    prisma.comision.create({
      data: {
        numero_comision: 2,
        nombre_comision: 'MD — Com. 2',
        cupo_maximo: 45,
        id_materia: materiaMD.id_materia,
        id_usuario_profesor: prof4.id_usuario,
      },
    }),
    // Arq: 2 comisiones
    prisma.comision.create({
      data: {
        numero_comision: 1,
        nombre_comision: 'Arq — Com. 1',
        cupo_maximo: 30,
        id_materia: materiaArq.id_materia,
        id_usuario_profesor: prof3.id_usuario,
      },
    }),
    prisma.comision.create({
      data: {
        numero_comision: 2,
        nombre_comision: 'Arq — Com. 2',
        cupo_maximo: 30,
        id_materia: materiaArq.id_materia,
        id_usuario_profesor: prof1.id_usuario,
      },
    }),
    // BD: 2 comisiones
    prisma.comision.create({
      data: {
        numero_comision: 1,
        nombre_comision: 'BD — Com. 1',
        cupo_maximo: 35,
        id_materia: materiaBD.id_materia,
        id_usuario_profesor: prof2.id_usuario,
      },
    }),
    prisma.comision.create({
      data: {
        numero_comision: 2,
        nombre_comision: 'BD — Com. 2',
        cupo_maximo: 35,
        id_materia: materiaBD.id_materia,
        id_usuario_profesor: prof4.id_usuario,
      },
    }),
    // SO: 2 comisiones
    prisma.comision.create({
      data: {
        numero_comision: 1,
        nombre_comision: 'SO — Com. 1',
        cupo_maximo: 40,
        id_materia: materiaSO.id_materia,
        id_usuario_profesor: prof2.id_usuario,
      },
    }),
    prisma.comision.create({
      data: {
        numero_comision: 2,
        nombre_comision: 'SO — Com. 2',
        cupo_maximo: 40,
        id_materia: materiaSO.id_materia,
        id_usuario_profesor: prof3.id_usuario,
      },
    }),
    // Redes: 1 comision
    prisma.comision.create({
      data: {
        numero_comision: 1,
        nombre_comision: 'Redes — Com. 1',
        cupo_maximo: 35,
        id_materia: materiaRedes.id_materia,
        id_usuario_profesor: prof4.id_usuario,
      },
    }),
  ]);

  const [
    comIS2_1,
    comIS2_2,
    comIS2_3,
    comMD_1,
    comMD_2,
    comArq_1,
    comArq_2,
    comBD_1,
    comBD_2,
    comSO_1,
    comSO_2,
    comRedes,
  ] = comisiones;

  // ── HORARIOS ──────────────────────────────────────────────────────────────
  await prisma.horarioComision.createMany({
    data: [
      {
        hora_inicio: '18:00',
        hora_fin: '22:00',
        id_comision: comIS2_1.id_comision,
        numero_dia: lunes.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: aula10.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '18:00',
        hora_fin: '20:00',
        id_comision: comIS2_1.id_comision,
        numero_dia: miercoles.numero_dia,
        id_modalidad: virtual.id_modalidad,
        id_aula: null,
        formato: 'PRACTICO',
      },
      {
        hora_inicio: '14:00',
        hora_fin: '18:00',
        id_comision: comIS2_2.id_comision,
        numero_dia: martes.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: aula12.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '14:00',
        hora_fin: '16:00',
        id_comision: comIS2_2.id_comision,
        numero_dia: jueves.numero_dia,
        id_modalidad: hibrido.id_modalidad,
        id_aula: null,
        formato: 'PRACTICO',
      },
      {
        hora_inicio: '08:00',
        hora_fin: '12:00',
        id_comision: comIS2_3.id_comision,
        numero_dia: sabado(viernes),
        id_modalidad: presencial.id_modalidad,
        id_aula: aula20.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '10:00',
        hora_fin: '12:00',
        id_comision: comMD_1.id_comision,
        numero_dia: lunes.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: aula12.id_aula,
        formato: 'TEORICO',
      },
      {
        hora_inicio: '10:00',
        hora_fin: '12:00',
        id_comision: comMD_1.id_comision,
        numero_dia: miercoles.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: labSistemas.id_aula,
        formato: 'PRACTICO',
      },
      {
        hora_inicio: '08:00',
        hora_fin: '10:00',
        id_comision: comMD_2.id_comision,
        numero_dia: martes.numero_dia,
        id_modalidad: virtual.id_modalidad,
        id_aula: null,
        formato: 'TEORICO',
      },
      {
        hora_inicio: '08:00',
        hora_fin: '10:00',
        id_comision: comMD_2.id_comision,
        numero_dia: jueves.numero_dia,
        id_modalidad: virtual.id_modalidad,
        id_aula: null,
        formato: 'PRACTICO',
      },
      {
        hora_inicio: '16:00',
        hora_fin: '20:00',
        id_comision: comArq_1.id_comision,
        numero_dia: miercoles.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: labRedes.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '14:00',
        hora_fin: '18:00',
        id_comision: comArq_2.id_comision,
        numero_dia: jueves.numero_dia,
        id_modalidad: hibrido.id_modalidad,
        id_aula: aula20.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '18:00',
        hora_fin: '22:00',
        id_comision: comBD_1.id_comision,
        numero_dia: jueves.numero_dia,
        id_modalidad: hibrido.id_modalidad,
        id_aula: labSistemas.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '10:00',
        hora_fin: '14:00',
        id_comision: comBD_2.id_comision,
        numero_dia: martes.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: aula10.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '18:00',
        hora_fin: '20:00',
        id_comision: comSO_1.id_comision,
        numero_dia: lunes.numero_dia,
        id_modalidad: virtual.id_modalidad,
        id_aula: null,
        formato: 'TEORICO',
      },
      {
        hora_inicio: '18:00',
        hora_fin: '20:00',
        id_comision: comSO_1.id_comision,
        numero_dia: miercoles.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: labRedes.id_aula,
        formato: 'PRACTICO',
      },
      {
        hora_inicio: '08:00',
        hora_fin: '12:00',
        id_comision: comSO_2.id_comision,
        numero_dia: viernes.numero_dia,
        id_modalidad: presencial.id_modalidad,
        id_aula: aula12.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
      {
        hora_inicio: '16:00',
        hora_fin: '20:00',
        id_comision: comRedes.id_comision,
        numero_dia: viernes.numero_dia,
        id_modalidad: hibrido.id_modalidad,
        id_aula: labRedes.id_aula,
        formato: 'TEORICO_PRACTICO',
      },
    ],
  });

  // ── INSCRIPCIONES ─────────────────────────────────────────────────────────
  // Distribuimos 30 alumnos entre las comisiones (2-3 materias por alumno)
  const inscripciones: { id_usuario: number; id_comision: number }[] = [];

  // Grupo A (alumnos 0-9): IS2 Com1, MD Com1, Arq Com1
  alumnos.slice(0, 10).forEach((a) => {
    inscripciones.push(
      { id_usuario: a.id_usuario, id_comision: comIS2_1.id_comision },
      { id_usuario: a.id_usuario, id_comision: comMD_1.id_comision },
      { id_usuario: a.id_usuario, id_comision: comArq_1.id_comision },
    );
  });

  // Grupo B (alumnos 10-19): IS2 Com2, MD Com2, BD Com1, SO Com1
  alumnos.slice(10, 20).forEach((a) => {
    inscripciones.push(
      { id_usuario: a.id_usuario, id_comision: comIS2_2.id_comision },
      { id_usuario: a.id_usuario, id_comision: comMD_2.id_comision },
      { id_usuario: a.id_usuario, id_comision: comBD_1.id_comision },
    );
  });

  // Grupo C (alumnos 20-29): IS2 Com3, Arq Com2, BD Com2, SO Com2, Redes
  alumnos.slice(20, 30).forEach((a) => {
    inscripciones.push(
      { id_usuario: a.id_usuario, id_comision: comIS2_3.id_comision },
      { id_usuario: a.id_usuario, id_comision: comArq_2.id_comision },
      { id_usuario: a.id_usuario, id_comision: comRedes.id_comision },
    );
  });

  // Demo alumno en las primeras comisiones
  const demoAlumno = extras.find((e) => !e.esProfesor)?.usuario;
  if (demoAlumno) {
    inscripciones.push(
      { id_usuario: demoAlumno.id_usuario, id_comision: comIS2_1.id_comision },
      { id_usuario: demoAlumno.id_usuario, id_comision: comMD_1.id_comision },
    );
  }

  await prisma.usuarioComision.createMany({
    data: inscripciones.map((i) => ({ ...i, estado: 'ACTIVO' as const })),
  });

  // ── EVENTOS ───────────────────────────────────────────────────────────────
  await prisma.evento.createMany({
    data: [
      {
        titulo: 'Parcial 1er Cuatrimestre',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-05-12T18:00:00Z'),
        fecha_fin: new Date('2026-05-12T20:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof1.id_usuario,
        id_materia: materiaIS2.id_materia,
        id_comision: comIS2_1.id_comision,
      },
      {
        titulo: 'Entrega TP Integrador',
        tipo_evento: 'ENTREGA_TP',
        fecha_inicio: new Date('2026-06-02T23:59:00Z'),
        fecha_fin: new Date('2026-06-02T23:59:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof1.id_usuario,
        id_materia: materiaIS2.id_materia,
        id_comision: comIS2_1.id_comision,
      },
      {
        titulo: 'Clase — Patrones de Diseño',
        tipo_evento: 'CLASE',
        fecha_inicio: new Date('2026-04-28T18:00:00Z'),
        fecha_fin: new Date('2026-04-28T20:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof1.id_usuario,
        id_materia: materiaIS2.id_materia,
        id_comision: comIS2_1.id_comision,
      },
      {
        titulo: 'Parcial 1er Cuatrimestre',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-05-14T14:00:00Z'),
        fecha_fin: new Date('2026-05-14T16:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof2.id_usuario,
        id_materia: materiaIS2.id_materia,
        id_comision: comIS2_2.id_comision,
      },
      {
        titulo: 'Entrega TP Grupal',
        tipo_evento: 'ENTREGA_TP',
        fecha_inicio: new Date('2026-05-30T23:59:00Z'),
        fecha_fin: new Date('2026-05-30T23:59:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof2.id_usuario,
        id_materia: materiaIS2.id_materia,
        id_comision: comIS2_2.id_comision,
      },
      {
        titulo: 'Parcial de Álgebra',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-05-20T10:00:00Z'),
        fecha_fin: new Date('2026-05-20T12:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof1.id_usuario,
        id_materia: materiaMD.id_materia,
        id_comision: comMD_1.id_comision,
      },
      {
        titulo: 'Entrega Práctica 3',
        tipo_evento: 'ENTREGA_TP',
        fecha_inicio: new Date('2026-05-06T23:59:00Z'),
        fecha_fin: new Date('2026-05-06T23:59:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof1.id_usuario,
        id_materia: materiaMD.id_materia,
        id_comision: comMD_1.id_comision,
      },
      {
        titulo: 'Recuperatorio Parcial',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-06-10T10:00:00Z'),
        fecha_fin: new Date('2026-06-10T12:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof1.id_usuario,
        id_materia: materiaMD.id_materia,
        id_comision: comMD_1.id_comision,
      },
      {
        titulo: 'Parcial de Arquitectura',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-05-27T16:00:00Z'),
        fecha_fin: new Date('2026-05-27T18:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof3.id_usuario,
        id_materia: materiaArq.id_materia,
        id_comision: comArq_1.id_comision,
      },
      {
        titulo: 'Lab. práctico — Ensamblador',
        tipo_evento: 'CLASE',
        fecha_inicio: new Date('2026-05-08T16:00:00Z'),
        fecha_fin: new Date('2026-05-08T18:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof3.id_usuario,
        id_materia: materiaArq.id_materia,
        id_comision: comArq_1.id_comision,
      },
      {
        titulo: 'Parcial de Base de Datos',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-06-04T18:00:00Z'),
        fecha_fin: new Date('2026-06-04T20:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof2.id_usuario,
        id_materia: materiaBD.id_materia,
        id_comision: comBD_1.id_comision,
      },
      {
        titulo: 'Entrega Proyecto Final BD',
        tipo_evento: 'ENTREGA_TP',
        fecha_inicio: new Date('2026-06-20T23:59:00Z'),
        fecha_fin: new Date('2026-06-20T23:59:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof2.id_usuario,
        id_materia: materiaBD.id_materia,
        id_comision: comBD_1.id_comision,
      },
      {
        titulo: 'Parcial de Sistemas Operativos',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-05-25T18:00:00Z'),
        fecha_fin: new Date('2026-05-25T20:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof2.id_usuario,
        id_materia: materiaSO.id_materia,
        id_comision: comSO_1.id_comision,
      },
      {
        titulo: 'Parcial de Redes',
        tipo_evento: 'PARCIAL',
        fecha_inicio: new Date('2026-06-12T16:00:00Z'),
        fecha_fin: new Date('2026-06-12T18:00:00Z'),
        origen: 'PROFESOR',
        id_usuario: prof4.id_usuario,
        id_materia: materiaRedes.id_materia,
        id_comision: comRedes.id_comision,
      },
    ],
  });

  // ── ESTADOS INTERCAMBIO ────────────────────────────────────────────────────
  const [estadoPendiente, estadoAceptado, estadoRechazado] = await Promise.all([
    prisma.estado.create({ data: { nombre_estado: 'PENDIENTE' } }),
    prisma.estado.create({ data: { nombre_estado: 'ACEPTADO' } }),
    prisma.estado.create({ data: { nombre_estado: 'RECHAZADO' } }),
    prisma.estado.create({ data: { nombre_estado: 'COMPLETADO' } }),
  ]);

  // ── INTERCAMBIOS ──────────────────────────────────────────────────────────
  // Para que un intercambio sea válido, AMBOS usuarios deben estar inscritos
  // en sus respectivas comisiones (FK a usuario_comision).
  // Grupo A (0-9): IS2_1, MD_1, Arq_1
  // Grupo B (10-19): IS2_2, MD_2, BD_1
  // Grupo C (20-29): IS2_3, Arq_2, Redes
  const [juan, maria, lucas, sofia, , , camila] = alumnos;     // Grupo A
  const [florencia, ignacio, , , micaela] = alumnos.slice(10); // Grupo B (índices 10-14)
  const [rocio] = alumnos.slice(20);                           // Grupo C (índice 20)

  await prisma.intercambio.createMany({
    data: [
      // Juan (IS2_1) ↔ Florencia (IS2_2) — pendiente
      {
        id_estado: estadoPendiente.id_estado,
        id_usuario_ofrece: juan.id_usuario,
        id_comision_ofrece: comIS2_1.id_comision,
        id_usuario_destino: florencia.id_usuario,
        id_comision_destino: comIS2_2.id_comision,
      },
      // María (IS2_1) ↔ Ignacio (IS2_2) — aceptado
      {
        id_estado: estadoAceptado.id_estado,
        id_usuario_ofrece: maria.id_usuario,
        id_comision_ofrece: comIS2_1.id_comision,
        id_usuario_destino: ignacio.id_usuario,
        id_comision_destino: comIS2_2.id_comision,
      },
      // Sofía (MD_1) ↔ Micaela (MD_2) — pendiente
      {
        id_estado: estadoPendiente.id_estado,
        id_usuario_ofrece: sofia.id_usuario,
        id_comision_ofrece: comMD_1.id_comision,
        id_usuario_destino: micaela.id_usuario,
        id_comision_destino: comMD_2.id_comision,
      },
      // Camila (Arq_1) ↔ Rocío (Arq_2) — rechazado
      {
        id_estado: estadoRechazado.id_estado,
        id_usuario_ofrece: camila.id_usuario,
        id_comision_ofrece: comArq_1.id_comision,
        id_usuario_destino: rocio.id_usuario,
        id_comision_destino: comArq_2.id_comision,
      },
    ],
  });

  // ── COLUMNAS TABLERO ──────────────────────────────────────────────────────
  await prisma.columnaTablero.createMany({
    data: [
      { nombre: 'Por hacer', orden_columna: 1 },
      { nombre: 'En progreso', orden_columna: 2 },
      { nombre: 'Hecho', orden_columna: 3 },
    ],
  });

  // ── NOTIFICACIONES ────────────────────────────────────────────────────────
  await prisma.notificacion.createMany({
    data: [
      {
        tipo: 'MATCHING_COMISION',
        titulo: 'Solicitud de intercambio recibida',
        mensaje: 'Juan Pérez quiere intercambiar IS2 Com1 por la tuya',
        datos: { id_comision: comIS2_1.id_comision, nombre_comision: 'IS2 — Com. 1', nombre_materia: 'Ingeniería de Software 2' },
        id_usuario: florencia.id_usuario,
      },
      {
        tipo: 'MATCHING_COMISION',
        titulo: 'Cambio de comisión completado',
        mensaje: 'Tu intercambio de IS2 fue completado exitosamente.',
        datos: { id_comision: comIS2_2.id_comision, nombre_comision: 'IS2 — Com. 2', nombre_materia: 'Ingeniería de Software 2' },
        id_usuario: ignacio.id_usuario,
      },
      {
        tipo: 'MATCHING_COMISION',
        titulo: 'Solicitud de intercambio rechazada',
        mensaje: 'Camila Sánchez rechazó tu solicitud de intercambio',
        datos: { id_comision: comArq_1.id_comision, nombre_comision: 'Arq — Com. 1', nombre_materia: 'Arquitectura de Computadoras' },
        id_usuario: rocio.id_usuario,
      },
      ...alumnos
        .slice(0, 8)
        .map((a) => ({
          tipo: 'SISTEMA' as const,
          titulo: 'Bienvenido al SIC',
          mensaje: 'Tu cuenta fue activada correctamente. Ya podés ver tus materias asignadas.',
          id_usuario: a.id_usuario,
        })),
    ],
  });

  // ── CONVERSACIONES Y MENSAJES ─────────────────────────────────────────────
  async function crearConversacion(
    u1: number,
    u2: number,
    msgs: { contenido: string; emisor: number; fecha: string }[],
  ) {
    const conv = await prisma.conversacion.create({
      data: {
        participantes: { create: [{ id_usuario: u1 }, { id_usuario: u2 }] },
      },
    });
    await prisma.mensaje.createMany({
      data: msgs.map((m) => ({
        contenido: m.contenido,
        id_conversacion: conv.id_conversacion,
        id_usuario_emisor: m.emisor,
        creado_en: new Date(m.fecha),
      })),
    });
    return conv;
  }

  await crearConversacion(juan.id_usuario, maria.id_usuario, [
    {
      contenido: 'Hola María! Te quería preguntar por el intercambio de IS2',
      emisor: juan.id_usuario,
      fecha: '2026-04-20T10:00:00Z',
    },
    {
      contenido:
        'Hola Juan! Sí, estoy interesada. ¿Cuáles son tus horarios actuales?',
      emisor: maria.id_usuario,
      fecha: '2026-04-20T10:05:00Z',
    },
    {
      contenido: 'Tengo IS2 Com1, los lunes 18 a 22. La tuya es martes ¿no?',
      emisor: juan.id_usuario,
      fecha: '2026-04-20T10:07:00Z',
    },
    {
      contenido:
        'Sí exacto, martes 14 a 18. Me viene mejor el lunes, gestionemos el intercambio',
      emisor: maria.id_usuario,
      fecha: '2026-04-20T10:10:00Z',
    },
    {
      contenido: 'Genial, lo cargo en el sistema ahora',
      emisor: juan.id_usuario,
      fecha: '2026-04-20T10:12:00Z',
    },
  ]);

  await crearConversacion(juan.id_usuario, lucas.id_usuario, [
    {
      contenido: 'Lucas! ¿Ya estudiaste para el parcial de Arq?',
      emisor: juan.id_usuario,
      fecha: '2026-04-19T20:00:00Z',
    },
    {
      contenido: 'Recién estoy arrancando jaja. ¿Nos juntamos a estudiar?',
      emisor: lucas.id_usuario,
      fecha: '2026-04-19T20:15:00Z',
    },
    {
      contenido: '¿El jueves a las 16 en la biblioteca?',
      emisor: juan.id_usuario,
      fecha: '2026-04-19T20:20:00Z',
    },
    {
      contenido: 'Perfecto, ahí nos vemos',
      emisor: lucas.id_usuario,
      fecha: '2026-04-19T20:22:00Z',
    },
  ]);

  await crearConversacion(juan.id_usuario, prof1.id_usuario, [
    {
      contenido:
        'Buenas profesor Martínez, tenía una consulta sobre el TP integrador',
      emisor: juan.id_usuario,
      fecha: '2026-04-18T14:00:00Z',
    },
    {
      contenido: 'Hola Juan, claro contame',
      emisor: prof1.id_usuario,
      fecha: '2026-04-18T14:30:00Z',
    },
    {
      contenido:
        '¿El diagrama de clases tiene que incluir todas las entidades o solo el módulo?',
      emisor: juan.id_usuario,
      fecha: '2026-04-18T14:31:00Z',
    },
    {
      contenido:
        'Solo el módulo. Pero mostrá las relaciones con los módulos adyacentes',
      emisor: prof1.id_usuario,
      fecha: '2026-04-18T15:00:00Z',
    },
    {
      contenido: 'Entendido, muchas gracias profe!',
      emisor: juan.id_usuario,
      fecha: '2026-04-18T15:05:00Z',
    },
  ]);

  await crearConversacion(maria.id_usuario, sofia.id_usuario, [
    {
      contenido: 'Sofi! ¿Tenés los apuntes de Discreta del lunes?',
      emisor: maria.id_usuario,
      fecha: '2026-04-17T19:00:00Z',
    },
    {
      contenido: 'Sí los tengo! Te los paso ahora',
      emisor: sofia.id_usuario,
      fecha: '2026-04-17T19:05:00Z',
    },
    {
      contenido: 'Genial! ¿Entendiste lo de combinatoria?',
      emisor: maria.id_usuario,
      fecha: '2026-04-17T19:06:00Z',
    },
    {
      contenido: 'Más o menos, podemos repasarlo juntas antes del parcial',
      emisor: sofia.id_usuario,
      fecha: '2026-04-17T19:10:00Z',
    },
    {
      contenido: 'Buenísimo! ¿El miércoles después de clase?',
      emisor: maria.id_usuario,
      fecha: '2026-04-17T19:12:00Z',
    },
    {
      contenido: 'Dale, perfecto',
      emisor: sofia.id_usuario,
      fecha: '2026-04-17T19:13:00Z',
    },
  ]);

  await crearConversacion(lucas.id_usuario, prof2.id_usuario, [
    {
      contenido: 'Profesora Fernández, consulta sobre el proyecto de BD',
      emisor: lucas.id_usuario,
      fecha: '2026-04-16T10:00:00Z',
    },
    {
      contenido: 'Hola Lucas, decime',
      emisor: prof2.id_usuario,
      fecha: '2026-04-16T10:45:00Z',
    },
    {
      contenido: '¿Podemos usar PostgreSQL o tiene que ser MySQL?',
      emisor: lucas.id_usuario,
      fecha: '2026-04-16T10:46:00Z',
    },
    {
      contenido:
        'Pueden usar cualquier motor relacional. PostgreSQL está perfecto',
      emisor: prof2.id_usuario,
      fecha: '2026-04-16T11:00:00Z',
    },
  ]);

  console.log('\n✅ Seed completo!');
  console.log(
    `   👤 ${alumnos.length} alumnos + ${profesores.length} profesores`,
  );
  console.log(`   📚 ${comisiones.length} comisiones con horarios`);
  console.log(`   📋 14 eventos`);
  console.log(`   🔄 4 intercambios`);
  console.log(`   💬 5 conversaciones`);
  console.log('\n   🔑 Contraseña de todos los usuarios: Password123!');
  console.log('   📧 Demo: alumno@sic.com / profesor@sic.com');
}

function sabado(viernes: { numero_dia: number }) {
  return viernes.numero_dia; // reusa viernes para simplificar
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
