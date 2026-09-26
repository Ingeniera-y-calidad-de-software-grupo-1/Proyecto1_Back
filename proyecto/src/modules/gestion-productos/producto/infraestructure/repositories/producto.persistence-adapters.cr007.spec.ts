import { ProductoPersistenceAdapter } from './producto.persistence-adapters';
import { Producto } from '../../domain/entities/producto.entity';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { UpdateProductoDto } from '../../dto/update-producto.dto';

describe('ProductoPersistenceAdapter - CR-007 Persistencia Atómica HistorialPrecio', () => {
  let adapter: ProductoPersistenceAdapter;
  let mockRepository: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;
  let mockDataSource: any;
  let mockHistorialPrecioRepository: any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn().mockReturnValue(mockRepository),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    mockHistorialPrecioRepository = {
      guardar: jest.fn().mockImplementation(async (historial) => historial),
      findByProductoId: jest.fn(),
    };

    adapter = new ProductoPersistenceAdapter(
      mockRepository,
      mockDataSource,
      {} as any,
      mockHistorialPrecioRepository,
    );
  });

  it('TP-CR007-09: debe persistir el producto y el historial atómicamente mediante el uow en update()', async () => {
    const existingProducto = new Producto();
    existingProducto.id = 1;
    existingProducto.denominacion = 'Producto Test';
    existingProducto.precio = 100;

    mockQueryBuilder.getOne.mockResolvedValue(existingProducto);

    const dto: UpdateProductoDto = {
      costo: 120,
      usuarioUpdatedId: 1,
      motivoCambioPrecio: 'Aumento de costos',
    };

    const historial = HistorialPrecio.crear({
      productoId: 1,
      precioAnterior: 100,
      precioNuevo: 120,
      motivo: 'Aumento de costos',
    });

    const result = await adapter.update(
      1,
      dto,
      { id: 1 } as any,
      { id: 1 } as any,
      { id: 1 } as any,
      historial,
    );

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockHistorialPrecioRepository.guardar).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('TP-CR007-10: debe propagar el error si guardar historialPrecio falla en el uow (rollback)', async () => {
    const existingProducto = new Producto();
    existingProducto.id = 1;
    existingProducto.denominacion = 'Producto Test';
    existingProducto.precio = 100;

    mockQueryBuilder.getOne.mockResolvedValue(existingProducto);
    mockHistorialPrecioRepository.guardar.mockRejectedValue(
      new Error('Error de persistencia en historial'),
    );

    const dto: UpdateProductoDto = {
      costo: 120,
      usuarioUpdatedId: 1,
      motivoCambioPrecio: 'Aumento de costos',
    };

    const historial = HistorialPrecio.crear({
      productoId: 1,
      precioAnterior: 100,
      precioNuevo: 120,
      motivo: 'Aumento de costos',
    });

    await expect(
      adapter.update(
        1,
        dto,
        { id: 1 } as any,
        { id: 1 } as any,
        { id: 1 } as any,
        historial,
      ),
    ).rejects.toThrow();

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('TP-CR007-10b: debe propagar el error y hacer rollback si falla la persistencia de Producto', async () => {
    const existingProducto = new Producto();
    existingProducto.id = 1;
    existingProducto.denominacion = 'Producto Test';
    existingProducto.precio = 100;

    mockQueryBuilder.getOne.mockResolvedValue(existingProducto);
    mockRepository.save.mockRejectedValue(new Error('Error al guardar producto'));

    const dto: UpdateProductoDto = {
      costo: 120,
      usuarioUpdatedId: 1,
      motivoCambioPrecio: 'Aumento de costos',
    };

    const historial = HistorialPrecio.crear({
      productoId: 1,
      precioAnterior: 100,
      precioNuevo: 120,
      motivo: 'Aumento de costos',
    });

    await expect(
      adapter.update(
        1,
        dto,
        { id: 1 } as any,
        { id: 1 } as any,
        { id: 1 } as any,
        historial,
      ),
    ).rejects.toThrow();

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockHistorialPrecioRepository.guardar).not.toHaveBeenCalled();
  });

  it('TP-CR007-11: no debe invocar a historialPrecioRepository si no se pasa historialPrecio', async () => {
    const existingProducto = new Producto();
    existingProducto.id = 1;
    existingProducto.denominacion = 'Producto Test';
    existingProducto.precio = 100;

    mockQueryBuilder.getOne.mockResolvedValue(existingProducto);

    const dto: UpdateProductoDto = {
      presentacion: 'Pack x 6',
      usuarioUpdatedId: 1,
    };

    const result = await adapter.update(
      1,
      dto,
      { id: 1 } as any,
      { id: 1 } as any,
      { id: 1 } as any,
      undefined,
    );

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockHistorialPrecioRepository.guardar).not.toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });
});
