import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTVerifyGetKey } from 'jose';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

type JwtClaims = {
  sub: string;
  email?: string;
  role?: string;
  aud?: string | string[];
  iss?: string;
  [key: string]: unknown;
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwks: JWTVerifyGetKey;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    if (!supabaseUrl) {
      throw new Error('Falta la variable SUPABASE_URL en .env');
    }

    this.issuer = `${supabaseUrl}/auth/v1`;
    this.audience = 'authenticated';
    this.jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Token Bearer faltante');
    }

    try {
      const { payload } = await jwtVerify<JwtClaims>(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });
      const datosUsuario = await this.obtenerDatosUsuario(payload.sub);
      request['user'] = { ...payload, roles: datosUsuario.roles, id_usuario: datosUsuario.id_usuario };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private async obtenerDatosUsuario(
    supabaseAuthId: string,
  ): Promise<{ roles: string[]; id_usuario: number | null }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { supabase_auth_id: supabaseAuthId },
      select: {
        id_usuario: true,
        roles: { select: { rol: { select: { nombre_rol: true } } } },
      },
    });
    return {
      id_usuario: usuario?.id_usuario ?? null,
      roles: usuario?.roles.map((r) => r.rol.nombre_rol) ?? [],
    };
  }

  private extractBearerToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) return null;
    return token;
  }
}
