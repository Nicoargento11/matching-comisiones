import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
export default defineConfig({
  schema: 'schema.prisma',
  migrations: {
    path: 'migrations',
  },
  datasource: {
    // Para migraciones en Supabase conviene DIRECT_URL (5432/session)
    url: env('DIRECT_URL'),
  },
});
