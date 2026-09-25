import { ProductoPersistenceAdapter } from './producto.persistence-adapters';
import { Producto } from '../../domain/entities/producto.entity';

describe('ProductoPersistenceAdapter - CR006 Actualización masiva de precios', () => {
  let adapter: ProductoPersistenceAdapter;
  let mockRepository: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;
  let mockDataSource: any;

  const crearProducto = (
    id: number,
    costo: number,
    precio: number,
    porcentaje: number,
  ): Producto => {
    const producto = new Producto();

    producto.id = id;
    producto.costo = costo;
    producto.precio = precio;
    producto.porcentaje = porcentaje;

    return producto;
  };

  beforeEach(() => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation(async (productos) => productos),
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

    adapter = new ProductoPersistenceAdapter(
      mockRepository,
      mockDataSource,
      {} as any,
    );
  });

  it('debe actualizar globalmente todos los productos activos por porcentaje', async () => {
    const productos = [
      crearProducto(1, 8000, 10000, 25),
      crearProducto(2, 10000, 15000, 50),
    ];

    mockQueryBuilder.getMany.mockResolvedValue(productos);

    const usuario = { id: 5 } as any;

    const cantidad = await adapter.actualizarPreciosMasivamente(
      {
        tipo: 'porcentaje',
        valor: 10,
        alcance: 'global',
        usuarioId: 5,
      },
      usuario,
    );

    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'producto.deletedAt IS NULL',
    );

    expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();

    expect(productos[0].precio).toBeCloseTo(11000);
    expect(productos[0].porcentaje).toBeCloseTo(37.5);

    expect(productos[1].precio).toBeCloseTo(16500);
    expect(productos[1].porcentaje).toBeCloseTo(65);

    expect(productos[0].usuarioUpdated).toBe(usuario);
    expect(productos[1].usuarioUpdated).toBe(usuario);

    expect(mockRepository.save).toHaveBeenCalledWith(productos);
    expect(cantidad).toBe(2);

    expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('debe filtrar por linea cuando el alcance es linea', async () => {
    const productos = [
      crearProducto(1, 8000, 10000, 25),
    ];

    mockQueryBuilder.getMany.mockResolvedValue(productos);

    const usuario = { id: 5 } as any;

    const cantidad = await adapter.actualizarPreciosMasivamente(
      {
        tipo: 'monto',
        valor: 2000,
        alcance: 'linea',
        lineaId: 3,
        usuarioId: 5,
      },
      usuario,
    );

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'producto.lineaId = :lineaId',
      {
        lineaId: 3,
      },
    );

    expect(productos[0].precio).toBeCloseTo(12000);
    expect(productos[0].porcentaje).toBeCloseTo(50);

    expect(mockRepository.save).toHaveBeenCalledWith(productos);
    expect(cantidad).toBe(1);

    expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('no debe aplicar filtro de linea cuando el alcance es global', async () => {
    mockQueryBuilder.getMany.mockResolvedValue([]);

    await adapter.actualizarPreciosMasivamente(
      {
        tipo: 'monto',
        valor: 1000,
        alcance: 'global',
        usuarioId: 5,
      },
      { id: 5 } as any,
    );

    expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
  });

  it('debe realizar rollback completo si un producto produce un precio invalido', async () => {
    const productos = [
      crearProducto(1, 8000, 10000, 25),
      crearProducto(2, 9500, 10000, 5.2631578947),
    ];

    mockQueryBuilder.getMany.mockResolvedValue(productos);

    await expect(
      adapter.actualizarPreciosMasivamente(
        {
          tipo: 'monto',
          valor: -1000,
          alcance: 'global',
          usuarioId: 5,
        },
        { id: 5 } as any,
      ),
    ).rejects.toThrow(
      'El ajuste solicitado produciría un precio inferior al costo del producto',
    );

    expect(mockRepository.save).not.toHaveBeenCalled();

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
  });

  it('debe retornar cero cuando no existen productos para actualizar', async () => {
    mockQueryBuilder.getMany.mockResolvedValue([]);

    const cantidad = await adapter.actualizarPreciosMasivamente(
      {
        tipo: 'porcentaje',
        valor: 10,
        alcance: 'global',
        usuarioId: 5,
      },
      { id: 5 } as any,
    );

    expect(cantidad).toBe(0);
    expect(mockRepository.save).toHaveBeenCalledWith([]);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });
});