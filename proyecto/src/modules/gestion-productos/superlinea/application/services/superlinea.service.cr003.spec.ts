import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SuperLineaService } from './superlinea.service';
import { SuperLineaDeletionPolicy } from '../../domain/services/superlinea-deletion.policy';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { SuperLinea } from '../../domain/entities/superlinea.entity';

describe('SuperLineaService - CR003', () => {
  let service: SuperLineaService;
  let repository: jest.Mocked<ISuperLineaRepository>;
  let deletionPolicy: jest.Mocked<SuperLineaDeletionPolicy>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByDenominacion: jest.fn(),
      findAll: jest.fn(),
      findByDenominacionFiltered: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      hasActiveLineas: jest.fn(),
    };

    deletionPolicy = {
      validate: jest.fn(),
    } as unknown as jest.Mocked<SuperLineaDeletionPolicy>;

    service = new SuperLineaService(repository, deletionPolicy);
  });

  describe('create', () => {
    it('debe crear una SuperLínea cuando la denominación no existe', async () => {
      repository.findByDenominacion.mockResolvedValue(null);

      repository.create.mockImplementation(async (superLinea) => {
        superLinea.id = 1;
        return superLinea;
      });

      const result = await service.create({
        denominacion: '  Construcción  ',
        observacion: '  Materiales  ',
        usuarioCreatedId: 1,
      });

      expect(repository.findByDenominacion).toHaveBeenCalledWith(
        'Construcción',
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: 'Construcción',
          observacion: 'Materiales',
          usuarioCreatedId: 1,
        }),
      );

      expect(result).toBeDefined();
    });

    it('debe rechazar una denominación duplicada', async () => {
      const existente = new SuperLinea();
      existente.id = 1;
      existente.denominacion = 'Construcción';

      repository.findByDenominacion.mockResolvedValue(existente);

      await expect(
        service.create({
          denominacion: 'Construcción',
          usuarioCreatedId: 1,
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('debe devolver una SuperLínea activa existente', async () => {
      const superLinea = new SuperLinea();
      superLinea.id = 1;
      superLinea.denominacion = 'Construcción';

      repository.findById.mockResolvedValue(superLinea);

      const result = await service.findById(1);

      expect(result).toBe(superLinea);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    it('debe lanzar NotFoundException cuando la SuperLínea no existe o no está activa', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe permitir modificar una SuperLínea existente', async () => {
      const actual = new SuperLinea();
      actual.id = 1;
      actual.denominacion = 'Construcción';

      repository.findById.mockResolvedValue(actual);
      repository.findByDenominacion.mockResolvedValue(null);

      repository.update.mockImplementation(async (_id, entity) => {
        return entity as SuperLinea;
      });

      const result = await service.update(1, {
        denominacion: '  Ferretería  ',
        observacion: '  Nueva observación  ',
        usuarioUpdatedId: 2,
      });

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          denominacion: 'Ferretería',
          observacion: 'Nueva observación',
          usuarioUpdatedId: 2,
        }),
      );

      expect(result).toBeDefined();
    });

    it('debe rechazar el cambio a una denominación utilizada por otra SuperLínea', async () => {
      const actual = new SuperLinea();
      actual.id = 1;
      actual.denominacion = 'Construcción';

      const existente = new SuperLinea();
      existente.id = 2;
      existente.denominacion = 'Ferretería';

      repository.findById.mockResolvedValue(actual);
      repository.findByDenominacion.mockResolvedValue(existente);

      await expect(
        service.update(1, {
          denominacion: 'Ferretería',
          usuarioUpdatedId: 2,
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('debe eliminar lógicamente una SuperLínea sin líneas activas', async () => {
      const superLinea = new SuperLinea();
      superLinea.id = 1;
      superLinea.denominacion = 'Construcción';
      superLinea.sistema = 0;

      repository.findById.mockResolvedValue(superLinea);
      deletionPolicy.validate.mockResolvedValue(undefined);
      repository.softDelete.mockResolvedValue(undefined);

      const result = await service.delete(1, 5);

      expect(deletionPolicy.validate).toHaveBeenCalledWith(1);
      expect(repository.softDelete).toHaveBeenCalledWith(1, 5);
      expect(result).toBeDefined();
    });

    it('debe impedir eliminar una SuperLínea del sistema', async () => {
      const superLinea = new SuperLinea();
      superLinea.id = 1;
      superLinea.denominacion = 'Sistema';
      superLinea.sistema = 1;

      repository.findById.mockResolvedValue(superLinea);

      await expect(service.delete(1, 5)).rejects.toThrow(
        BadRequestException,
      );

      expect(deletionPolicy.validate).not.toHaveBeenCalled();
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('debe impedir la eliminación cuando la política detecta líneas activas', async () => {
      const superLinea = new SuperLinea();
      superLinea.id = 1;
      superLinea.denominacion = 'Construcción';
      superLinea.sistema = 0;

      repository.findById.mockResolvedValue(superLinea);

      deletionPolicy.validate.mockRejectedValue(
        new BadRequestException(
          'No se puede eliminar la superlínea porque tiene líneas activas asociadas.',
        ),
      );

      await expect(service.delete(1, 5)).rejects.toThrow(
        BadRequestException,
      );

      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});