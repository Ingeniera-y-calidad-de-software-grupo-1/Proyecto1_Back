import { Margen } from './margen.vo';

describe('Margen Value Object', () => {
  it('debe crear un Margen válido con el porcentaje indicado', () => {
    const margen = new Margen(20);
    expect(margen.valor).toBe(20);
  });

  it('debe permitir margen cero (0%)', () => {
    const margen = new Margen(0);
    expect(margen.valor).toBe(0);
  });

  it('debe permitir márgenes con decimales', () => {
    const margen = new Margen(15.5);
    expect(margen.valor).toBe(15.5);
  });

  it('debe usar 15% como valor por defecto cuando no se provee argumento', () => {
    const margen = new Margen();
    expect(margen.valor).toBe(15);
  });

  it('debe usar 15% como valor por defecto cuando se pasa null o undefined', () => {
    const margenNull = new Margen(null);
    const margenUndefined = new Margen(undefined);
    expect(margenNull.valor).toBe(15);
    expect(margenUndefined.valor).toBe(15);
  });

  it('debe proveer un método estático porDefecto() con valor 15', () => {
    const margen = Margen.porDefecto();
    expect(margen.valor).toBe(15);
  });

  it('debe rechazar márgenes negativos con un error descriptivo', () => {
    expect(() => new Margen(-1)).toThrow('El margen no puede ser negativo');
    expect(() => new Margen(-0.01)).toThrow('El margen no puede ser negativo');
  });

  it('debe rechazar valores no numéricos o NaN', () => {
    expect(() => new Margen(NaN)).toThrow('El margen debe ser un número válido');
    expect(() => new Margen(Infinity)).toThrow('El margen debe ser un número válido');
    expect(() => new Margen('invalido' as any)).toThrow('El margen debe ser un número válido');
  });

  it('debe ser inmutable', () => {
    const margen = new Margen(15);
    expect(Object.isFrozen(margen)).toBe(true);
    expect(() => {
      (margen as any)._valor = 30;
    }).toThrow();
  });

  it('debe comparar por valor (carencia de identidad conceptual)', () => {
    const margen1 = new Margen(15);
    const margen2 = new Margen(15);
    const margen3 = new Margen(25);

    expect(margen1.equals(margen2)).toBe(true);
    expect(margen1.equals(margen3)).toBe(false);
    expect(margen1.equals(null)).toBe(false);
    expect(margen1.equals(undefined)).toBe(false);
  });
});
