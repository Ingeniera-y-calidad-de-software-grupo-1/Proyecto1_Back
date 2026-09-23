import { ProductoPersistenceAdapter } from './producto.persistence-adapters';

describe('ProductoPersistenceAdapter - QueryBuilder CR-004', () => {
  let mockQueryBuilder: any;
  let mockRepository: any;
  let adapter: ProductoPersistenceAdapter;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    adapter = new ProductoPersistenceAdapter(
      mockRepository,
      {} as any,
      {} as any,
    );
  });

  // 1. JOIN DE SUPERLÍNEA
  it('1. JOIN DE SUPERLÍNEA: debe incluir los joins requeridos para linea y superLinea', async () => {
    await adapter.findBy({});

    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'producto.linea',
      'linea',
    );
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'linea.superLinea',
      'superLinea',
    );
  });

  // 2. BÚSQUEDA PARCIAL POR LÍNEA
  it('2. BÚSQUEDA PARCIAL POR LÍNEA: con denominacionLinea debe agregar condición con UPPER, LIKE y ESCAPE', async () => {
    await adapter.findBy({ denominacionLinea: 'INDUS' });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("UPPER(linea.denominacion) LIKE UPPER(:denominacionLinea) ESCAPE '!'"),
      expect.objectContaining({
        denominacionLinea: '%INDUS%',
      }),
    );
  });

  // 3. BÚSQUEDA PARCIAL POR SUPERLÍNEA
  it('3. BÚSQUEDA PARCIAL POR SUPERLÍNEA: con denominacionSuperLinea debe agregar condición con UPPER, LIKE y ESCAPE', async () => {
    await adapter.findBy({ denominacionSuperLinea: 'CONSTR' });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("UPPER(superLinea.denominacion) LIKE UPPER(:denominacionSuperLinea) ESCAPE '!'"),
      expect.objectContaining({
        denominacionSuperLinea: '%CONSTR%',
      }),
    );
  });

  // 4. COMBINACIÓN DE CRITERIOS
  it('4. COMBINACIÓN DE CRITERIOS: debe conservar denominacion en bloque histórico y Línea/SuperLínea independientes', async () => {
    await adapter.findBy({
      denominacion: 'TORNILLO',
      denominacionLinea: 'BULONERIA',
      denominacionSuperLinea: 'FIJACIONES',
    });

    const andWhereCalls = mockQueryBuilder.andWhere.mock.calls;

    // Bloque histórico para denominación
    const hasHistoricoBlock = andWhereCalls.some(([sql, params]: [string, any]) =>
      sql.includes('UPPER(producto.denominacion) LIKE UPPER(:denominacion)') &&
      params?.denominacion === '%TORNILLO%',
    );
    expect(hasHistoricoBlock).toBe(true);

    // Condición independiente para Línea
    const hasLineaCondition = andWhereCalls.some(([sql, params]: [string, any]) =>
      sql.includes('UPPER(linea.denominacion) LIKE UPPER(:denominacionLinea)') &&
      params?.denominacionLinea === '%BULONERIA%',
    );
    expect(hasLineaCondition).toBe(true);

    // Condición independiente para SuperLínea
    const hasSuperLineaCondition = andWhereCalls.some(([sql, params]: [string, any]) =>
      sql.includes('UPPER(superLinea.denominacion) LIKE UPPER(:denominacionSuperLinea)') &&
      params?.denominacionSuperLinea === '%FIJACIONES%',
    );
    expect(hasSuperLineaCondition).toBe(true);
  });

  // 5. LINEA ID + DENOMINACION LINEA
  it('5. LINEA ID + DENOMINACION LINEA: debe permitir la coexistencia acumulativa de ambos filtros', async () => {
    await adapter.findBy({
      lineaId: 10,
      denominacionLinea: 'FERRETERIA',
    });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'linea.id = :linea_id',
      { linea_id: 10 },
    );

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("UPPER(linea.denominacion) LIKE UPPER(:denominacionLinea) ESCAPE '!'"),
      { denominacionLinea: '%FERRETERIA%' },
    );
  });

  // 6. PRODUCTOS ELIMINADOS
  it('6. PRODUCTOS ELIMINADOS: debe filtrar siempre deletedAt IS NULL', async () => {
    await adapter.findBy({});

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'producto.deletedAt IS NULL',
    );
  });

  // 7. PAGINACIÓN
  it('7. PAGINACIÓN: debe aplicar skip, take, orderBy y getManyAndCount', async () => {
    const result = await adapter.findBy({
      skip: 15,
      take: 25,
    });

    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
      'producto.denominacion',
      'ASC',
    );
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith(15);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
    expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [], total: 0 });
  });

  // 8. ESCAPE DE COMODINES
  it('8. ESCAPE DE COMODINES: entrada con % debe transformarse en !% dentro de los parámetros', async () => {
    await adapter.findBy({
      denominacionLinea: '10%',
      denominacionSuperLinea: '10%',
    });

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("UPPER(linea.denominacion) LIKE UPPER(:denominacionLinea) ESCAPE '!'"),
      { denominacionLinea: '%10!%%' },
    );

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("UPPER(superLinea.denominacion) LIKE UPPER(:denominacionSuperLinea) ESCAPE '!'"),
      { denominacionSuperLinea: '%10!%%' },
    );
  });
});
