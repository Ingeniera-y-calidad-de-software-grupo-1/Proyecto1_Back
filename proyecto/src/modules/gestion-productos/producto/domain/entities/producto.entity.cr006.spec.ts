import { Producto } from './producto.entity';

describe('Producto - CR006 Actualización masiva de precios', () => {
  const crearProducto = (
    costo = 8000,
    precio = 10000,
    porcentaje = 25,
  ): Producto => {
    const producto = new Producto();

    producto.costo = costo;
    producto.precio = precio;
    producto.porcentaje = porcentaje;

    return producto;
  };

  describe('Ajuste por porcentaje', () => {
    it('debe aumentar el precio un 10% y recalcular el margen', () => {
      const producto = crearProducto();

      const resultado =
        producto.aplicarAjustePrecioPorPorcentaje(10);

      expect(resultado.valor).toBeCloseTo(11000);
      expect(producto.precio).toBeCloseTo(11000);
      expect(producto.porcentaje).toBeCloseTo(37.5);
      expect(producto.costo).toBe(8000);
    });

    it('debe disminuir el precio un 10% y recalcular el margen', () => {
      const producto = crearProducto();

      const resultado =
        producto.aplicarAjustePrecioPorPorcentaje(-10);

      expect(resultado.valor).toBeCloseTo(9000);
      expect(producto.precio).toBeCloseTo(9000);
      expect(producto.porcentaje).toBeCloseTo(12.5);
      expect(producto.costo).toBe(8000);
    });
  });

  describe('Ajuste por monto', () => {
    it('debe aumentar el precio por un monto fijo', () => {
      const producto = crearProducto();

      const resultado =
        producto.aplicarAjustePrecioPorMonto(2000);

      expect(resultado.valor).toBeCloseTo(12000);
      expect(producto.precio).toBeCloseTo(12000);
      expect(producto.porcentaje).toBeCloseTo(50);
      expect(producto.costo).toBe(8000);
    });

    it('debe disminuir el precio por un monto fijo', () => {
      const producto = crearProducto();

      const resultado =
        producto.aplicarAjustePrecioPorMonto(-1000);

      expect(resultado.valor).toBeCloseTo(9000);
      expect(producto.precio).toBeCloseTo(9000);
      expect(producto.porcentaje).toBeCloseTo(12.5);
      expect(producto.costo).toBe(8000);
    });
  });

  describe('Validaciones', () => {
    it('debe rechazar un producto con costo cero', () => {
      const producto = crearProducto(0, 10000, 0);

      expect(() =>
        producto.aplicarAjustePrecioPorPorcentaje(10),
      ).toThrow(
        'No se puede actualizar masivamente el precio de un producto con costo menor o igual a cero',
      );
    });

    it('debe rechazar un precio resultante menor o igual a cero', () => {
      const producto = crearProducto();

      expect(() =>
        producto.aplicarAjustePrecioPorMonto(-10000),
      ).toThrow(
        'El precio resultante de la actualización debe ser mayor a cero',
      );
    });

    it('debe rechazar un precio resultante inferior al costo', () => {
      const producto = crearProducto();

      expect(() =>
        producto.aplicarAjustePrecioPorMonto(-3000),
      ).toThrow(
        'El ajuste solicitado produciría un precio inferior al costo del producto',
      );
    });

    it('debe rechazar un porcentaje no válido', () => {
      const producto = crearProducto();

      expect(() =>
        producto.aplicarAjustePrecioPorPorcentaje(NaN),
      ).toThrow(
        'El porcentaje de ajuste debe ser un número válido',
      );
    });

    it('debe rechazar un monto no válido', () => {
      const producto = crearProducto();

      expect(() =>
        producto.aplicarAjustePrecioPorMonto(Infinity),
      ).toThrow(
        'El monto de ajuste debe ser un número válido',
      );
    });
  });
});