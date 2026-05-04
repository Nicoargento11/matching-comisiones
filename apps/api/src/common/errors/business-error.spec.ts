import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from './business-error';

describe('NotFoundError', () => {
  it('debe ser instancia de NotFoundException', () => {
    const error = new NotFoundError(
      'USUARIO_NO_ENCONTRADO',
      'No existe el usuario',
    );
    expect(error).toBeInstanceOf(NotFoundException);
  });

  it('debe exponer el codigo y el message en el body', () => {
    const error = new NotFoundError(
      'COMISION_NO_ENCONTRADA',
      'No existe la comisión',
    );
    const response = error.getResponse() as Record<string, unknown>;
    expect(response.codigo).toBe('COMISION_NO_ENCONTRADA');
    expect(response.message).toBe('No existe la comisión');
  });

  it('debe propagar el mensaje como error.message', () => {
    const error = new NotFoundError('X', 'No existe la comisión');
    expect(error.message).toBe('No existe la comisión');
  });

  it('debe tener statusCode 404', () => {
    const error = new NotFoundError('X', 'msg');
    expect(error.getStatus()).toBe(404);
  });
});

describe('ConflictError', () => {
  it('debe ser instancia de ConflictException', () => {
    const error = new ConflictError('COMISION_YA_INSCRITO', 'Ya está inscrito');
    expect(error).toBeInstanceOf(ConflictException);
  });

  it('debe tener statusCode 409', () => {
    expect(new ConflictError('X', 'msg').getStatus()).toBe(409);
  });
});

describe('ForbiddenError', () => {
  it('debe ser instancia de ForbiddenException', () => {
    const error = new ForbiddenError('COMISION_SIN_PROFESOR', 'Sin permiso');
    expect(error).toBeInstanceOf(ForbiddenException);
  });

  it('debe tener statusCode 403', () => {
    expect(new ForbiddenError('X', 'msg').getStatus()).toBe(403);
  });
});

describe('BadRequestError', () => {
  it('debe ser instancia de BadRequestException', () => {
    const error = new BadRequestError(
      'HORARIO_HORA_INVALIDA',
      'hora_fin debe ser mayor',
    );
    expect(error).toBeInstanceOf(BadRequestException);
  });

  it('debe tener statusCode 400', () => {
    expect(new BadRequestError('X', 'msg').getStatus()).toBe(400);
  });

  it('debe propagar el mensaje como error.message', () => {
    const error = new BadRequestError('DNI_INVALIDO', 'DNI muy corto');
    expect(error.message).toBe('DNI muy corto');
  });
});
