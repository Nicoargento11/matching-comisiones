import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesRepository } from './repositories/notificaciones.repository';

const mockNotificacionRaw = {
  id_notificacion: 1,
  id_usuario: 5,
  tipo: 'SISTEMA',
  titulo: 'Aviso',
  mensaje: 'Mensaje de prueba',
  leida: false,
  creada_en: new Date('2026-06-01T10:00:00.000Z'),
  datos: null,
};

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  let repository: jest.Mocked<NotificacionesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        {
          provide: NotificacionesRepository,
          useValue: {
            crearNotificacion: jest.fn(),
            obtenerPorUsuario: jest.fn(),
            verificarExistencia: jest.fn(),
            marcarLeida: jest.fn(),
            marcarTodasLeidas: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificacionesService>(NotificacionesService);
    repository = module.get(NotificacionesRepository);
  });

  describe('crearNotificacion', () => {
    it('debe llamar al repositorio con los datos recibidos', async () => {
      repository.crearNotificacion.mockResolvedValue(undefined as any);

      await service.crearNotificacion({
        id_usuario: 5,
        tipo: 'SISTEMA' as any,
        titulo: 'Test',
        mensaje: 'msg',
        datos: {},
      });

      expect(repository.crearNotificacion).toHaveBeenCalledTimes(1);
    });
  });

  describe('obtenerPorUsuario', () => {
    it('debe retornar las notificaciones del usuario', async () => {
      repository.obtenerPorUsuario.mockResolvedValue([mockNotificacionRaw] as any);

      const result = await service.obtenerPorUsuario(5);

      expect(repository.obtenerPorUsuario).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(1);
    });

    it('debe retornar array vacío cuando no hay notificaciones', async () => {
      repository.obtenerPorUsuario.mockResolvedValue([]);

      const result = await service.obtenerPorUsuario(5);

      expect(result).toEqual([]);
    });
  });

  describe('marcarSoloLeida', () => {
    it('debe marcar como leída cuando la notificación pertenece al usuario', async () => {
      repository.verificarExistencia.mockResolvedValue(mockNotificacionRaw as any);
      repository.marcarLeida.mockResolvedValue({
        ...mockNotificacionRaw,
        leida: true,
      } as any);

      await service.marcarSoloLeida(1, 5);

      expect(repository.marcarLeida).toHaveBeenCalledWith(1);
    });

    it('debe lanzar NotFoundException cuando la notificación no existe', async () => {
      repository.verificarExistencia.mockResolvedValue(null);

      await expect(service.marcarSoloLeida(999, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ForbiddenException cuando la notificación no pertenece al usuario', async () => {
      repository.verificarExistencia.mockResolvedValue({
        ...mockNotificacionRaw,
        id_usuario: 99, // distinto usuario
      } as any);

      await expect(service.marcarSoloLeida(1, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('marcarTodasLeidas', () => {
    it('debe delegar al repositorio con el id del usuario', async () => {
      repository.marcarTodasLeidas.mockResolvedValue(undefined as any);

      await service.marcarTodasLeidas(5);

      expect(repository.marcarTodasLeidas).toHaveBeenCalledWith(5);
    });
  });
});
