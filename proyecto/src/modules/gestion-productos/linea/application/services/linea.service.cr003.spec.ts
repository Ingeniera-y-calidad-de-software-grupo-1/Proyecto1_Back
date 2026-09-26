import { ConflictException, NotFoundException } from '@nestjs/common';
import { LineaService } from './linea.service';
import { ILineaRepository } from '../../domain/interfaces/linea.repository.interface';
import { PoliticaEliminacionLinea } from '../../domain/services/politica-eliminacion-linea.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { SuperLineaService } from '../../../superlinea/application/services/superlinea.service';
import { Linea } from '../../domain/entities/linea.entity';
import { SuperLinea } from '../../../superlinea/domain/entities/superlinea.entity';

describe('LineaService - CR003', () => {
  let service: LineaService;
  let repository: jest.Mocked<ILineaRepository>;
  let validacionesService: jest.Mocked<PoliticaEliminacionLinea>;
  let usuarioService: jest.Mocked<UsuarioService>;
  let superLineaService: jest.Mocked<SuperLineaService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      findByDenominacionFiltered: jest.fn(),
      findAllFor: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      findByDenominacionWith: jest.fn(),
      findAllListado: jest.fn(),
    } as unknown as jest.Mocked<ILineaRepository>;

    validacionesService = {
      tieneProductosActivosParaLinea: jest.fn(),
    } as unknown as jest.Mocked<PoliticaEliminacionLinea>;

    usuarioService = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<UsuarioService>;

    superLineaService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<SuperLineaService>;

    service = new LineaService(
      repository,
      validacionesService,
      usuarioService,
      superLineaService,
    );
  });

  describe('create', () => {
    it('debe crear una Línea asociada a una SuperLínea existente y activa', async () => {
      repository.findByDenominacionWith.mockResolvedValue(null);

      const superLinea = new SuperLinea();
      superLinea.id = 10;
      superLinea.denominacion = 'Construcción';

      superLineaService.findById.mockResolvedValue(superLinea);

      const lineaCreada = new Linea();
      lineaCreada.id = 1;
      lineaCreada.denominacion = 'Herramientas';
      lineaCreada.superLineaId = 10;

      repository.create.mockResolvedValue(lineaCreada);

      const dto = {
        denominacion: 'Herramientas',
        superLineaId: 10,
        usuarioCreatedId: 1,
        utilizaStockMinimo: false,
        deletedAt: null,
      };

      const result = await service.create(dto);

      expect(superLineaService.findById).toHaveBeenCalledWith(10);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result).toBeDefined();
    });

    it('debe impedir crear una Línea si la SuperLínea no existe o no está activa', async () => {
      repository.findByDenominacionWith.mockResolvedValue(null);

      superLineaService.findById.mockRejectedValue(
        new NotFoundException('SuperLínea no encontrada.'),
      );

      const dto = {
        denominacion: 'Herramientas',
        superLineaId: 99,
        usuarioCreatedId: 1,
        utilizaStockMinimo: false,
        deletedAt: null,
      };

      await expect(service.create(dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(superLineaService.findById).toHaveBeenCalledWith(99);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('debe impedir crear una Línea con denominación duplicada antes de validar la SuperLínea', async () => {
      const existente = new Linea();
      existente.id = 5;
      existente.denominacion = 'HERRAMIENTAS';

      repository.findByDenominacionWith.mockResolvedValue(existente);

      const dto = {
        denominacion: 'Herramientas',
        superLineaId: 10,
        usuarioCreatedId: 1,
        utilizaStockMinimo: false,
        deletedAt: null,
      };

      await expect(service.create(dto)).rejects.toThrow(
        ConflictException,
      );

      expect(superLineaService.findById).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe permitir cambiar una Línea a otra SuperLínea existente y activa', async () => {
      const linea = new Linea();
      linea.id = 1;
      linea.denominacion = 'Herramientas';
      linea.superLineaId = 10;
      linea.sistema = 0;

      repository.findOne.mockResolvedValue(linea);

      const nuevaSuperLinea = new SuperLinea();
      nuevaSuperLinea.id = 20;
      nuevaSuperLinea.denominacion = 'Ferretería';

      superLineaService.findById.mockResolvedValue(nuevaSuperLinea);

      const lineaActualizada = new Linea();
      lineaActualizada.id = 1;
      lineaActualizada.denominacion = 'Herramientas';
      lineaActualizada.superLineaId = 20;

      repository.update.mockResolvedValue(lineaActualizada);

      const dto = {
        superLineaId: 20,
        usuarioUpdatedId: 2,
        utilizaStockMinimo: false,
        updatedAt: new Date(),
      };

      const result = await service.update(1, dto);

      expect(superLineaService.findById).toHaveBeenCalledWith(20);
      expect(repository.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBeDefined();
    });

    it('debe impedir cambiar una Línea a una SuperLínea inexistente o eliminada', async () => {
      const linea = new Linea();
      linea.id = 1;
      linea.denominacion = 'Herramientas';
      linea.superLineaId = 10;
      linea.sistema = 0;

      repository.findOne.mockResolvedValue(linea);

      superLineaService.findById.mockRejectedValue(
        new NotFoundException('SuperLínea no encontrada.'),
      );

      const dto = {
        superLineaId: 99,
        usuarioUpdatedId: 2,
        utilizaStockMinimo: false,
        updatedAt: new Date(),
      };

      await expect(service.update(1, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(superLineaService.findById).toHaveBeenCalledWith(99);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('no debe validar nuevamente la SuperLínea si la edición no modifica superLineaId', async () => {
      const linea = new Linea();
      linea.id = 1;
      linea.denominacion = 'Herramientas';
      linea.superLineaId = 10;
      linea.sistema = 0;

      repository.findOne.mockResolvedValue(linea);
      repository.findByDenominacionWith.mockResolvedValue(null);

      const lineaActualizada = new Linea();
      lineaActualizada.id = 1;
      lineaActualizada.denominacion = 'Herramientas Manuales';
      lineaActualizada.superLineaId = 10;

      repository.update.mockResolvedValue(lineaActualizada);

      const dto = {
        denominacion: 'Herramientas Manuales',
        usuarioUpdatedId: 2,
        utilizaStockMinimo: false,
        updatedAt: new Date(),
      };

      const result = await service.update(1, dto);

      expect(superLineaService.findById).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBeDefined();
    });
  });
});