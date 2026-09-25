import { Presentacion } from './presentacion.vo';

describe('Value Object: Presentacion (CR-002)', () => {
  // TP-01
  it('TP-01: Presentacion("1L") debe ser válida y conservar el valor "1L"', () => {
    const vo = new Presentacion('1L');
    expect(vo.valor).toBe('1L');
  });

  // TP-02
  it('TP-02: Presentacion(" Botella 750 cc ") debe ser válida y sanear a "Botella 750 cc"', () => {
    const vo = new Presentacion(' Botella 750 cc ');
    expect(vo.valor).toBe('Botella 750 cc');
  });

  // TP-03
  it('TP-03: Presentacion("") debe lanzar error de dominio', () => {
    expect(() => new Presentacion('')).toThrow(
      'La presentación no puede estar vacía',
    );
  });

  // TP-04
  it('TP-04: Presentacion("   ") debe lanzar error de dominio', () => {
    expect(() => new Presentacion('   ')).toThrow(
      'La presentación no puede estar vacía',
    );
  });

  // TP-06
  it('TP-06: Presentacion con más de 50 caracteres debe ser inválida', () => {
    const masDe50 = 'a'.repeat(51);
    expect(() => new Presentacion(masDe50)).toThrow(
      'La presentación no puede superar los 50 caracteres',
    );
  });

  // TP-07
  it('TP-07: Presentacion con exactamente 50 caracteres debe ser válida', () => {
    const exactamente50 = 'a'.repeat(50);
    const vo = new Presentacion(exactamente50);
    expect(vo.valor).toBe(exactamente50);
    expect(vo.valor.length).toBe(50);
  });

  it('debe rechazar null o undefined', () => {
    expect(() => new Presentacion(null as any)).toThrow(
      'La presentación no puede ser nula ni indefinida',
    );
    expect(() => new Presentacion(undefined as any)).toThrow(
      'La presentación no puede ser nula ni indefinida',
    );
  });

  it('debe rechazar tipos no string', () => {
    expect(() => new Presentacion(123 as any)).toThrow(
      'La presentación debe ser una cadena de texto',
    );
  });

  it('debe ser inmutable (Object.isFrozen)', () => {
    const vo = new Presentacion('500 g');
    expect(Object.isFrozen(vo)).toBe(true);
    expect(() => {
      (vo as any)._valor = 'otro';
    }).toThrow();
  });

  it('debe comparar igualdad conceptual por valor con equals()', () => {
    const vo1 = new Presentacion('750 cc');
    const vo2 = new Presentacion(' 750 cc ');
    const vo3 = new Presentacion('1L');

    expect(vo1.equals(vo2)).toBe(true);
    expect(vo1.equals(vo3)).toBe(false);
    expect(vo1.equals(null)).toBe(false);
  });

  it('debe permitir crear mediante Presentacion.crear() con idéntico comportamiento', () => {
    const vo = Presentacion.crear(' Lata 354 cc ');
    expect(vo.valor).toBe('Lata 354 cc');
  });

  it('NO debe normalizar semánticamente equivalencias de unidades', () => {
    const vo1 = new Presentacion('1 Litro');
    const vo2 = new Presentacion('1L');
    const vo3 = new Presentacion('1000 ml');

    expect(vo1.valor).toBe('1 Litro');
    expect(vo2.valor).toBe('1L');
    expect(vo3.valor).toBe('1000 ml');
    expect(vo1.equals(vo2)).toBe(false);
  });
});
