import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
export type CurrentUserClaims = {
  sub: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};
type RequestWithUser = Request & {
  user?: CurrentUserClaims;
};
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserClaims | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
