import { getMetadataArgsStorage } from 'typeorm';
import { HistorialPrecio } from './historial-precio.entity';

describe('HistorialPrecio Entity TypeORM Metadata (CR-007)', () => {
  it('debe registrar exactamente la columna física producto_id compartida con @JoinColumn sin columnas duplicadas', () => {
    const storage = getMetadataArgsStorage();

    // 1. Columnas declaradas en HistorialPrecio
    const columnas = storage.columns.filter((c) => c.target === HistorialPrecio);
    const colProductoId = columnas.find((c) => c.propertyName === 'productoId');

    expect(colProductoId).toBeDefined();
    expect(colProductoId!.options.name).toBe('producto_id');
    expect(colProductoId!.options.type).toBe('int');

    // Verificar que no exista otra columna con dbName 'productoId'
    const colDuplicada = columnas.find((c) => c.propertyName === 'producto_id' || c.options.name === 'productoId');
    expect(colDuplicada).toBeUndefined();

    // 2. Relación ManyToOne con Producto
    const relaciones = storage.relations.filter((r) => r.target === HistorialPrecio);
    const relProducto = relaciones.find((r) => r.propertyName === 'producto');

    expect(relProducto).toBeDefined();
    expect(relProducto!.relationType).toBe('many-to-one');
    expect(relProducto!.options.onDelete).toBe('NO ACTION');
    expect(relProducto!.options.cascade).toBeFalsy();
    expect(relProducto!.options.eager).toBeFalsy();

    // 3. JoinColumn de la relación
    const joinColumns = storage.joinColumns.filter((j) => j.target === HistorialPrecio);
    const joinColProducto = joinColumns.find((j) => j.propertyName === 'producto');

    expect(joinColProducto).toBeDefined();
    expect(joinColProducto!.name).toBe('producto_id');

    // 4. Ambas apuntan al mismo nombre físico de columna 'producto_id'
    expect(colProductoId!.options.name).toBe(joinColProducto!.name);
  });

  it('debe tener los campos de precio como decimal(15,5) y motivo como varchar(255)', () => {
    const storage = getMetadataArgsStorage();
    const columnas = storage.columns.filter((c) => c.target === HistorialPrecio);

    const colAnterior = columnas.find((c) => c.propertyName === 'precioAnterior');
    expect(colAnterior).toBeDefined();
    expect(colAnterior!.options.name).toBe('precio_anterior');
    expect(colAnterior!.options.precision).toBe(15);
    expect(colAnterior!.options.scale).toBe(5);

    const colNuevo = columnas.find((c) => c.propertyName === 'precioNuevo');
    expect(colNuevo).toBeDefined();
    expect(colNuevo!.options.name).toBe('precio_nuevo');
    expect(colNuevo!.options.precision).toBe(15);
    expect(colNuevo!.options.scale).toBe(5);

    const colMotivo = columnas.find((c) => c.propertyName === 'motivo');
    expect(colMotivo).toBeDefined();
    expect(colMotivo!.options.name).toBe('motivo');
    expect(colMotivo!.options.length).toBe(255);
  });

  it('debe registrar el índice compuesto IDX_historial_precio_producto_fecha sobre [productoId, fecha]', () => {
    const storage = getMetadataArgsStorage();
    const indices = storage.indices.filter((i) => i.target === HistorialPrecio);

    const indiceCompuesto = indices.find(
      (i) => i.name === 'IDX_historial_precio_producto_fecha',
    );

    expect(indiceCompuesto).toBeDefined();
    expect(indiceCompuesto!.columns).toEqual(['productoId', 'fecha']);
  });

  describe('Fábrica estática y validación de invariantes de dominio (HistorialPrecio.crear)', () => {
    it('debe crear una instancia válida de HistorialPrecio con motivo saneado', () => {
      const historial = HistorialPrecio.crear({
        productoId: 10,
        precioAnterior: 100.5,
        precioNuevo: 120.75,
        motivo: '  Aumento de costos de logística  ',
      });

      expect(historial).toBeInstanceOf(HistorialPrecio);
      expect(historial.productoId).toBe(10);
      expect(historial.precioAnterior).toBe(100.5);
      expect(historial.precioNuevo).toBe(120.75);
      expect(historial.motivo).toBe('Aumento de costos de logística');
    });

    it('debe rechazar productoId si es inválido (<= 0, NaN o no numérico)', () => {
      expect(() =>
        HistorialPrecio.crear({
          productoId: 0,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El productoId debe ser un identificador válido mayor a cero');

      expect(() =>
        HistorialPrecio.crear({
          productoId: -5,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El productoId debe ser un identificador válido mayor a cero');

      expect(() =>
        HistorialPrecio.crear({
          productoId: NaN,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El productoId debe ser un identificador válido mayor a cero');
    });

    it('debe rechazar precioAnterior si es negativo, NaN o no numérico', () => {
      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: -10,
          precioNuevo: 120,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El precio anterior debe ser un número válido no negativo');

      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: NaN,
          precioNuevo: 120,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El precio anterior debe ser un número válido no negativo');
    });

    it('debe rechazar precioNuevo si es <= 0, NaN o no numérico (RN-CR007-01)', () => {
      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 0,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El nuevo precio debe ser estrictamente mayor a cero');

      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: -50,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El nuevo precio debe ser estrictamente mayor a cero');

      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: NaN,
          motivo: 'Cambio de precio',
        }),
      ).toThrow('El nuevo precio debe ser estrictamente mayor a cero');
    });

    it('debe rechazar motivo si no es string, o si es nulo o indefinido', () => {
      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: null as any,
        }),
      ).toThrow('El motivo debe ser una cadena de texto');

      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: undefined as any,
        }),
      ).toThrow('El motivo debe ser una cadena de texto');

      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: 12345 as any,
        }),
      ).toThrow('El motivo debe ser una cadena de texto');
    });

    it('debe rechazar motivo vacío o compuesto únicamente por espacios (RN-CR007-02)', () => {
      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: '',
        }),
      ).toThrow('El motivo no puede estar vacío');

      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: '    ',
        }),
      ).toThrow('El motivo no puede estar vacío');
    });

    it('debe rechazar motivo que supere 255 caracteres', () => {
      const motivoLargo = 'A'.repeat(256);
      expect(() =>
        HistorialPrecio.crear({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 120,
          motivo: motivoLargo,
        }),
      ).toThrow('El motivo no puede superar los 255 caracteres');
    });

    it('los transformers de columna decimal deben convertir correctamente a número y a string', () => {
      const storage = getMetadataArgsStorage();
      const colAnterior = storage.columns.find(
        (c) => c.target === HistorialPrecio && c.propertyName === 'precioAnterior',
      );
      const transformer = colAnterior?.options.transformer as any;

      expect(transformer).toBeDefined();
      expect(transformer.to(123.45)).toBe('123.45');
      expect(transformer.from('123.45000')).toBe(123.45);
    });
  });
});
