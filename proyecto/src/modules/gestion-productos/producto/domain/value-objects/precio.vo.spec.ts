import { Precio } from './precio.vo';

describe('Precio Value Object', () => {
  it('debe crear un Precio válido con el importe indicado', () => {
    const precio = new Precio(1150);
    expect(precio.valor).toBe(1150);
  });

  it('debe permitir precio cero', () => {
    const precio = new Precio(0);
    expect(precio.valor).toBe(0);
  });

  it('debe conservar el valor exacto con decimales sin transformarlo arbitrariamente', () => {
    const precio = new Precio(12.1325);
    expect(precio.valor).toBe(12.1325);

    const precio2 = new Precio(114.9885);
    expect(precio2.valor).toBe(114.9885);
  });

  it('debe rechazar precios negativos', () => {
    expect(() => new Precio(-1)).toThrow('El precio no puede ser negativo');
    expect(() => new Precio(-0.01)).toThrow('El precio no puede ser negativo');
  });

  it('debe rechazar valores inválidos (NaN, Infinity, no numéricos)', () => {
    expect(() => new Precio(NaN)).toThrow('El precio debe ser un número válido');
    expect(() => new Precio(Infinity)).toThrow('El precio debe ser un número válido');
    expect(() => new Precio(-Infinity)).toThrow('El precio debe ser un número válido');
    expect(() => new Precio('mil' as any)).toThrow('El precio debe ser un número válido');
  });

  it('debe ser inmutable', () => {
    const precio = new Precio(100);
    expect(Object.isFrozen(precio)).toBe(true);
    expect(() => {
      (precio as any)._valor = 200;
    }).toThrow();
  });

  it('debe comparar por valor (carencia de identidad conceptual)', () => {
    const precio1 = new Precio(1150);
    const precio2 = new Precio(1150);
    const precio3 = new Precio(1250);

    expect(precio1.equals(precio2)).toBe(true);
    expect(precio1.equals(precio3)).toBe(false);
    expect(precio1.equals(null)).toBe(false);
    expect(precio1.equals(undefined)).toBe(false);
  });
});
