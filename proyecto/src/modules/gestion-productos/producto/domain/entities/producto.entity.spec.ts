import { Producto } from './producto.entity';
import { Precio } from '../value-objects';

describe('Producto Aggregate Root - calcularPrecio()', () => {
  let producto: Producto;

  beforeEach(() => {
    producto = new Producto();
  });

  it('debe calcular el precio con costo 1000 y margen 15 dando 1150', () => {
    producto.costo = 1000;
    producto.porcentaje = 15;

    const precio = producto.calcularPrecio();

    expect(precio).toBeInstanceOf(Precio);
    expect(precio.valor).toBe(1150);
    expect(producto.precio).toBe(1150);
  });

  it('debe calcular el precio con otro margen (costo 1000 y margen 25 dando 1250)', () => {
    producto.costo = 1000;
    producto.porcentaje = 25;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(1250);
    expect(producto.precio).toBe(1250);
  });

  it('debe calcular correctamente cuando el margen es 0%', () => {
    producto.costo = 500;
    producto.porcentaje = 0;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(500);
    expect(producto.precio).toBe(500);
  });

  it('debe aplicar margen por defecto de 15% cuando porcentaje no está definido en el producto', () => {
    producto.costo = 1000;
    producto.porcentaje = undefined;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(1150);
    expect(producto.precio).toBe(1150);
  });

  it('debe manejar costo cero dando precio cero', () => {
    producto.costo = 0;
    producto.porcentaje = 15;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(0);
    expect(producto.precio).toBe(0);
  });

  it('debe calcular precios con decimales conservando el valor resultante', () => {
    producto.costo = 100;
    producto.porcentaje = 12.5; // 100 * 1.125 = 112.5

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(112.5);
    expect(producto.precio).toBe(112.5);
  });

  it('debe lanzar un error si el costo no está definido (undefined o null)', () => {
    producto.costo = undefined;
    expect(() => producto.calcularPrecio()).toThrow('No se puede calcular el precio sin un costo definido');

    producto.costo = null as any;
    expect(() => producto.calcularPrecio()).toThrow('No se puede calcular el precio sin un costo definido');
  });

  it('debe lanzar un error si el costo es negativo', () => {
    producto.costo = -100;
    producto.porcentaje = 15;

    expect(() => producto.calcularPrecio()).toThrow('El costo no puede ser negativo');
  });

  it('debe lanzar un error si el costo es un valor no numérico o NaN', () => {
    producto.costo = NaN;
    expect(() => producto.calcularPrecio()).toThrow('El costo debe ser un número válido');

    producto.costo = Infinity;
    expect(() => producto.calcularPrecio()).toThrow('El costo debe ser un número válido');
  });

  it('debe rechazar el cálculo si el porcentaje almacenado es negativo a través del VO Margen', () => {
    producto.costo = 1000;
    producto.porcentaje = -10;

    expect(() => producto.calcularPrecio()).toThrow('El margen no puede ser negativo');
  });
});
