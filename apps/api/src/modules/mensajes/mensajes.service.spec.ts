import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { MensajesRepository } from './repositories/mensajes.repository';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

describe('MensajesService', () => {
  let service: MensajesService;
  let repository: jest.Mocked<MensajesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MensajesService,
        {
          provide: MensajesRepository,
          useValue: {
            buscarConversacionExistente: jest.fn(),
            crearConversacion: jest.fn(),
            obtenerConversacion: jest.fn(),
            buscarParticipante: jest.fn(),
            actualizarUltimoLeido: jest.fn(),
            verificarExistenciaConversacion: jest.fn(),
            obtenerMensajes: jest.fn(),
            buscarUsuarioPorAuthId: jest.fn(),
            obtenerConversacionesDeUsuario: jest.fn(),
            contarConversacionesDeUsuario: jest.fn(),
            crearMensaje: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MensajesService>(MensajesService);
    repository = module.get(MensajesRepository);
  });

  describe('obtenerMisConversaciones', () => {
    it('debe retornar conversaciones paginadas del usuario', async () => {
      const paginacionDto = new PaginacionDto();
      repository.buscarUsuarioPorAuthId.mockResolvedValue({ id_usuario: 1 });
      repository.obtenerConversacionesDeUsuario.mockResolvedValue([]);
      repository.contarConversacionesDeUsuario.mockResolvedValue(0);

      const result = await service.obtenerMisConversaciones(
        'auth-123',
        paginacionDto,
      );

      expect(result).toEqual({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      repository.buscarUsuarioPorAuthId.mockResolvedValue(null);

      await expect(
        service.obtenerMisConversaciones('auth-unknown', new PaginacionDto()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerConversacion', () => {
    it('debe retornar la conversación cuando existe', async () => {
      const mockConversacion = { id_conversacion: 1, mensajes: [] };
      repository.obtenerConversacion.mockResolvedValue(mockConversacion as any);

      const result = await service.obtenerConversacion(1);

      expect(repository.obtenerConversacion).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockConversacion);
    });

    it('debe lanzar NotFoundException cuando no existe', async () => {
      repository.obtenerConversacion.mockResolvedValue(null);

      await expect(service.obtenerConversacion(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('enviarMensaje', () => {
    it('debe crear un mensaje cuando la conversación existe', async () => {
      repository.verificarExistenciaConversacion.mockResolvedValue({
        id_conversacion: 1,
      } as any);
      repository.crearMensaje.mockResolvedValue({
        id_mensaje: 1,
        contenido: 'Hola',
      } as any);

      const dto = {
        contenido: 'Hola',
        id_conversacion: 1,
        id_usuario_emisor: 5,
      };
      await service.enviarMensaje(dto as any);

      expect(repository.crearMensaje).toHaveBeenCalledWith(dto);
    });

    it('debe lanzar NotFoundException cuando la conversación no existe', async () => {
      repository.verificarExistenciaConversacion.mockResolvedValue(null);

      await expect(
        service.enviarMensaje({
          contenido: 'Hola',
          id_conversacion: 999,
          id_usuario_emisor: 5,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('crearConversacion', () => {
    it('debe crear la conversación cuando no existe una previa', async () => {
      const mockConversacion = { id_conversacion: 5, participantes: [] };
      repository.buscarConversacionExistente.mockResolvedValue(null);
      repository.crearConversacion.mockResolvedValue(mockConversacion as any);

      const result = await service.crearConversacion({
        id_usuario_1: 1,
        id_usuario_2: 2,
      } as any);

      expect(repository.buscarConversacionExistente).toHaveBeenCalledWith(1, 2);
      expect(repository.crearConversacion).toHaveBeenCalled();
      expect(result).toEqual(mockConversacion);
    });

    it('debe lanzar ConflictException cuando ya existe una conversación entre los usuarios', async () => {
      repository.buscarConversacionExistente.mockResolvedValue({
        id_conversacion: 3,
      } as any);

      await expect(
        service.crearConversacion({ id_usuario_1: 1, id_usuario_2: 2 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('marcarLeido', () => {
    it('debe actualizar ultimo_leido cuando el participante existe', async () => {
      repository.buscarParticipante.mockResolvedValue({
        id_conversacion: 1,
        id_usuario: 5,
      } as any);
      repository.actualizarUltimoLeido.mockResolvedValue({
        id_conversacion: 1,
        id_usuario: 5,
        ultimo_leido: new Date(),
      } as any);

      await service.marcarLeido(1, { id_usuario: 5 } as any);

      expect(repository.actualizarUltimoLeido).toHaveBeenCalledWith(1, 5);
    });

    it('debe lanzar NotFoundException cuando el usuario no pertenece a la conversación', async () => {
      repository.buscarParticipante.mockResolvedValue(null);

      await expect(
        service.marcarLeido(1, { id_usuario: 99 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerMensajes', () => {
    it('debe retornar los mensajes cuando la conversación existe', async () => {
      const mockMensajes = [{ id_mensaje: 1, contenido: 'Hola' }];
      repository.verificarExistenciaConversacion.mockResolvedValue({
        id_conversacion: 1,
      } as any);
      repository.obtenerMensajes.mockResolvedValue(mockMensajes as any);

      const result = await service.obtenerMensajes(1);

      expect(repository.obtenerMensajes).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMensajes);
    });

    it('debe lanzar NotFoundException cuando la conversación no existe', async () => {
      repository.verificarExistenciaConversacion.mockResolvedValue(null);

      await expect(service.obtenerMensajes(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
