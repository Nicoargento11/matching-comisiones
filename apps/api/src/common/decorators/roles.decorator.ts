import { SetMetadata } from '@nestjs/common';

/** Clave de metadata para los roles requeridos por endpoint */
export const ROLES_KEY = 'roles';

/**
 * Decorador que establece los roles requeridos para acceder a un endpoint
 * @param roles - Lista de nombres de rol permitidos (ej: 'admin', 'profesor', 'estudiante')
 * @example @Roles('admin', 'profesor')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
