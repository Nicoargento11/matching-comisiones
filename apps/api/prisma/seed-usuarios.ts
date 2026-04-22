import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function crearEnAuth(email: string, password: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existente = list?.users?.find((u) => u.email === email);
    if (existente) return existente.id;
    throw new Error(`Error creando ${email}: ${error.message}`);
  }
  return data.user.id;
}

const PASSWORD = 'Password123!';

const usuarios = [
  { nombre: 'Juan',        apellido: 'Pérez',      dni: 40100001, correo: 'juan.perez@sic.com',         rol: 'estudiante' },
  { nombre: 'María',       apellido: 'García',     dni: 40100002, correo: 'maria.garcia@sic.com',        rol: 'estudiante' },
  { nombre: 'Lucas',       apellido: 'Rodríguez',  dni: 40100003, correo: 'lucas.rodriguez@sic.com',     rol: 'estudiante' },
  { nombre: 'Sofía',       apellido: 'López',      dni: 40100004, correo: 'sofia.lopez@sic.com',         rol: 'estudiante' },
  { nombre: 'Martín',      apellido: 'Fernández',  dni: 40100005, correo: 'martin.fernandez@sic.com',    rol: 'estudiante' },
  { nombre: 'Valentina',   apellido: 'Torres',     dni: 40100006, correo: 'valentina.torres@sic.com',    rol: 'estudiante' },
  { nombre: 'Nicolás',     apellido: 'Ramírez',    dni: 40100007, correo: 'nicolas.ramirez@sic.com',     rol: 'estudiante' },
  { nombre: 'Camila',      apellido: 'Sánchez',    dni: 40100008, correo: 'camila.sanchez@sic.com',      rol: 'estudiante' },
  { nombre: 'Facundo',     apellido: 'Moreno',     dni: 40100009, correo: 'facundo.moreno@sic.com',      rol: 'estudiante' },
  { nombre: 'Agustina',    apellido: 'Romero',     dni: 40100010, correo: 'agustina.romero@sic.com',     rol: 'estudiante' },
  { nombre: 'Tomás',       apellido: 'Díaz',       dni: 40100011, correo: 'tomas.diaz@sic.com',          rol: 'estudiante' },
  { nombre: 'Florencia',   apellido: 'Álvarez',    dni: 40100012, correo: 'florencia.alvarez@sic.com',   rol: 'estudiante' },
  { nombre: 'Ignacio',     apellido: 'Ruiz',       dni: 40100013, correo: 'ignacio.ruiz@sic.com',        rol: 'estudiante' },
  { nombre: 'Luciana',     apellido: 'Jiménez',    dni: 40100014, correo: 'luciana.jimenez@sic.com',     rol: 'estudiante' },
  { nombre: 'Sebastián',   apellido: 'Herrera',    dni: 40100015, correo: 'sebastian.herrera@sic.com',   rol: 'estudiante' },
  { nombre: 'Micaela',     apellido: 'Medina',     dni: 40100016, correo: 'micaela.medina@sic.com',      rol: 'estudiante' },
  { nombre: 'Matías',      apellido: 'Castro',     dni: 40100017, correo: 'matias.castro@sic.com',       rol: 'estudiante' },
  { nombre: 'Julieta',     apellido: 'Ortiz',      dni: 40100018, correo: 'julieta.ortiz@sic.com',       rol: 'estudiante' },
  { nombre: 'Rodrigo',     apellido: 'Vargas',     dni: 40100019, correo: 'rodrigo.vargas@sic.com',      rol: 'estudiante' },
  { nombre: 'Natalia',     apellido: 'Molina',     dni: 40100020, correo: 'natalia.molina@sic.com',      rol: 'estudiante' },
  { nombre: 'Ezequiel',    apellido: 'Silva',      dni: 40100021, correo: 'ezequiel.silva@sic.com',      rol: 'estudiante' },
  { nombre: 'Rocío',       apellido: 'Guerrero',   dni: 40100022, correo: 'rocio.guerrero@sic.com',      rol: 'estudiante' },
  { nombre: 'Leandro',     apellido: 'Delgado',    dni: 40100023, correo: 'leandro.delgado@sic.com',     rol: 'estudiante' },
  { nombre: 'Carolina',    apellido: 'Mendoza',    dni: 40100024, correo: 'carolina.mendoza@sic.com',    rol: 'estudiante' },
  { nombre: 'Pablo',       apellido: 'Ibáñez',     dni: 40100025, correo: 'pablo.ibanez@sic.com',        rol: 'estudiante' },
  { nombre: 'Daniela',     apellido: 'Vega',       dni: 40100026, correo: 'daniela.vega@sic.com',        rol: 'estudiante' },
  { nombre: 'Maximiliano', apellido: 'Ramos',      dni: 40100027, correo: 'maxi.ramos@sic.com',          rol: 'estudiante' },
  { nombre: 'Aldana',      apellido: 'Reyes',      dni: 40100028, correo: 'aldana.reyes@sic.com',        rol: 'estudiante' },
  { nombre: 'Guido',       apellido: 'Navarro',    dni: 40100029, correo: 'guido.navarro@sic.com',       rol: 'estudiante' },
  { nombre: 'Florencia',   apellido: 'Pinto',      dni: 40100030, correo: 'florencia.pinto@sic.com',     rol: 'estudiante' },
  { nombre: 'Ana',         apellido: 'Villalba',   dni: 20200001, correo: 'ana.villalba@sic.com',        rol: 'profesor' },
  { nombre: 'Carlos',      apellido: 'Benítez',    dni: 20200002, correo: 'carlos.benitez@sic.com',      rol: 'profesor' },
  { nombre: 'Laura',       apellido: 'Suárez',     dni: 20200003, correo: 'laura.suarez@sic.com',        rol: 'profesor' },
  { nombre: 'Roberto',     apellido: 'Quiroga',    dni: 20200004, correo: 'roberto.quiroga@sic.com',     rol: 'profesor' },
];

async function main() {
  const [rolEstudiante, rolProfesor] = await Promise.all([
    prisma.rol.findFirstOrThrow({ where: { nombre_rol: 'estudiante' } }),
    prisma.rol.findFirstOrThrow({ where: { nombre_rol: 'profesor' } }),
  ]);

  // Sincroniza la secuencia con el máximo id existente para evitar conflictos
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'), COALESCE(MAX(id_usuario), 0) + 1, false) FROM usuario`;

  const materias = await prisma.materia.findMany({ select: { id_materia: true, nombre_materia: true } });
  if (materias.length === 0) throw new Error('No hay materias en la DB. Corré seed.ts primero.');

  const profesoresCreados: { id_usuario: number; nombre: string }[] = [];

  for (const u of usuarios) {
    const authId = await crearEnAuth(u.correo, PASSWORD);

    const usuario = await prisma.usuario.upsert({
      where: { correo: u.correo },
      update: { supabase_auth_id: authId },
      create: {
        nombre_usuario:    u.nombre,
        apellido_usuario:  u.apellido,
        dni:               u.dni,
        correo:            u.correo,
        contrasena:        PASSWORD,
        supabase_auth_id:  authId,
      },
    });

    const rol = u.rol === 'profesor' ? rolProfesor : rolEstudiante;
    await prisma.rolUsuario.upsert({
      where: { id_usuario_id_rol: { id_usuario: usuario.id_usuario, id_rol: rol.id_rol } },
      update: {},
      create: { id_usuario: usuario.id_usuario, id_rol: rol.id_rol },
    });

    if (u.rol === 'profesor') profesoresCreados.push({ id_usuario: usuario.id_usuario, nombre: u.nombre });

    console.log(`✅ ${u.correo}`);
  }

  // Asignar comisiones a los profesores nuevos
  console.log('\n📚 Asignando comisiones a profesores...');
  const asignaciones = [
    { idx: 0, comisiones: [{ numero: 201, nombre: 'Comisión 201 BD',  materia: 0 }, { numero: 202, nombre: 'Comisión 202 BD',  materia: 0 }] },
    { idx: 1, comisiones: [{ numero: 203, nombre: 'Comisión 203 SO',  materia: 1 % materias.length }, { numero: 204, nombre: 'Comisión 204 SO',  materia: 1 % materias.length }] },
    { idx: 2, comisiones: [{ numero: 205, nombre: 'Comisión 205 ARQ', materia: 2 % materias.length }] },
    { idx: 3, comisiones: [{ numero: 206, nombre: 'Comisión 206 MD',  materia: 3 % materias.length }, { numero: 207, nombre: 'Comisión 207 MD',  materia: 3 % materias.length }] },
  ];

  for (const asig of asignaciones) {
    const prof = profesoresCreados[asig.idx];
    if (!prof) continue;
    for (const c of asig.comisiones) {
      await prisma.comision.create({
        data: {
          numero_comision:    c.numero,
          nombre_comision:    c.nombre,
          cupo_maximo:        30,
          id_usuario_profesor: prof.id_usuario,
          id_materia:         materias[c.materia].id_materia,
        },
      });
      console.log(`   ✅ ${c.nombre} → ${prof.nombre}`);
    }
  }

  console.log(`\n✔ ${usuarios.length} usuarios creados. Password: ${PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
