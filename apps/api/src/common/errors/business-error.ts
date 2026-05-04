import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

/** NotFoundException con código de error estructurado */
export class NotFoundError extends NotFoundException {
  constructor(
    public readonly codigo: string,
    message: string,
  ) {
    super({ codigo, message });
  }
}

/** ConflictException con código de error estructurado */
export class ConflictError extends ConflictException {
  constructor(
    public readonly codigo: string,
    message: string,
  ) {
    super({ codigo, message });
  }
}

/** ForbiddenException con código de error estructurado */
export class ForbiddenError extends ForbiddenException {
  constructor(
    public readonly codigo: string,
    message: string,
  ) {
    super({ codigo, message });
  }
}

/** BadRequestException con código de error estructurado */
export class BadRequestError extends BadRequestException {
  constructor(
    public readonly codigo: string,
    message: string,
  ) {
    super({ codigo, message });
  }
}
