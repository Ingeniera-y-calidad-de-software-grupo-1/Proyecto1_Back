import { Repository } from 'typeorm';
import { HistorialPrecioRepository } from './historial-precio.repository';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';

describe('HistorialPrecioRepository (CR-007)', () => {
  let repository: HistorialPrecioRepository;
  let mockTypeOrmRepo: jest.Mocked<Partial<Repository<HistorialPrecio>>>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockTypeOrmRepo = {
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    repository = new HistorialPrecioRepository(mockTypeOrmRepo as any);
  });

  describe('guardar', () => {
    it('debe persistir con this.repository cuando no se pasa uow', async () => {
      const historial = new HistorialPrecio();
      (mockTypeOrmRepo.save as jest.Mock).mockResolvedValue(historial);

      const result = await repository.guardar(historial);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(historial);
      expect(result).toBe(historial);
    });

    it('debe persistir con uow.getRepository cuando se pasa uow', async () => {
      const historial = new HistorialPrecio();
      const mockUowRepo = { save: jest.fn().mockResolvedValue(historial) };
      const mockUow: Partial<IUnitOfWork> = {
        getRepository: jest.fn().mockReturnValue(mockUowRepo as any),
      };

      const result = await repository.guardar(historial, mockUow as IUnitOfWork);

      expect(mockUow.getRepository).toHaveBeenCalledWith(HistorialPrecio);
      expect(mockUowRepo.save).toHaveBeenCalledWith(historial);
      expect(result).toBe(historial);
    });

    it('debe lanzar DatabaseConnectionException si save falla', async () => {
      const historial = new HistorialPrecio();
      (mockTypeOrmRepo.save as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(repository.guardar(historial)).rejects.toThrow(
        DatabaseConnectionException,
      );
    });
  });

  describe('findByProductoId', () => {
    it('debe consultar con QueryBuilder ordenando por fecha DESC', async () => {
      const historialList = [new HistorialPrecio(), new HistorialPrecio()];
      mockQueryBuilder.getMany.mockResolvedValue(historialList);

      const result = await repository.findByProductoId(42);

      expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('historial');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'historial.producto_id = :productoId',
        { productoId: 42 },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('historial.fecha', 'DESC');
      expect(result).toBe(historialList);
    });

    it('debe lanzar DatabaseConnectionException si la consulta falla', async () => {
      mockQueryBuilder.getMany.mockRejectedValue(new Error('Query failed'));

      await expect(repository.findByProductoId(42)).rejects.toThrow(
        DatabaseConnectionException,
      );
    });
  });
});
