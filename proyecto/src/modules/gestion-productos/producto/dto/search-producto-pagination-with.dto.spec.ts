import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SearchProductoPaginationWithDto } from './search-producto-pagination-with.dto';

describe('SearchProductoPaginationWithDto - CR-004', () => {
  it('debe ser válido con todos los campos vacíos usando valores por defecto', async () => {
    const dto = plainToInstance(SearchProductoPaginationWithDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.skip).toBe(0);
    expect(dto.take).toBe(10);
    expect(dto.codProveedorExacto).toBe(false);
    expect(dto.codReferenciaExacto).toBe(false);
  });

  it('debe aceptar denominacionLinea y denominacionSuperLinea válidas', async () => {
    const dto = plainToInstance(SearchProductoPaginationWithDto, {
      denominacion: 'Tornillo',
      denominacionLinea: 'Ferretería',
      denominacionSuperLinea: 'Construcción',
      skip: 5,
      take: 20,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.denominacion).toBe('Tornillo');
    expect(dto.denominacionLinea).toBe('Ferretería');
    expect(dto.denominacionSuperLinea).toBe('Construcción');
    expect(dto.skip).toBe(5);
    expect(dto.take).toBe(20);
  });

  it('debe rechazar denominacionLinea si no es string', async () => {
    const dto = plainToInstance(SearchProductoPaginationWithDto, {
      denominacionLinea: 12345,
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'denominacionLinea');
    expect(error).toBeDefined();
    expect(error?.constraints?.isString).toBeDefined();
  });

  it('debe rechazar denominacionSuperLinea si no es string', async () => {
    const dto = plainToInstance(SearchProductoPaginationWithDto, {
      denominacionSuperLinea: 67890,
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'denominacionSuperLinea');
    expect(error).toBeDefined();
    expect(error?.constraints?.isString).toBeDefined();
  });

  it('debe preservar filtros existentes combinados con los nuevos', async () => {
    const dto = plainToInstance(SearchProductoPaginationWithDto, {
      denominacion: 'Bulón',
      denominacionLinea: 'Bulonería',
      denominacionSuperLinea: 'Metalúrgica',
      marcaId: 3,
      lineaId: 7,
      proveedorId: 2,
      conStock: 'true',
      codProveedorExacto: 'true',
      codReferenciaExacto: 'false',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.marcaId).toBe(3);
    expect(dto.lineaId).toBe(7);
    expect(dto.proveedorId).toBe(2);
    expect(dto.conStock).toBe(true);
    expect(dto.codProveedorExacto).toBe(true);
    expect(dto.codReferenciaExacto).toBe(false);
  });

  it('debe rechazar skip negativo', async () => {
    const dto = plainToInstance(SearchProductoPaginationWithDto, {
      skip: -1,
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'skip');
    expect(error).toBeDefined();
  });

  it('debe rechazar take menor a 1', async () => {
    const dto = plainToInstance(SearchProductoPaginationWithDto, {
      take: 0,
    });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'take');
    expect(error).toBeDefined();
  });
});
