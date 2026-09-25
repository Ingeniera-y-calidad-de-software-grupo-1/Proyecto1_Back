/**
 * Value Object: Presentacion
 * Representa el formato físico o comercial con el que se presenta un producto (ej.: "1L", "750 cc", "500 g").
 * Es inmutable, carece de identidad conceptual y encapsula las invariantes de validación y saneamiento:
 * - No null ni undefined.
 * - No vacío ni compuesto únicamente por espacios en blanco.
 * - Sanea aplicando trim() a los extremos.
 * - Longitud máxima de 50 caracteres (exactamente 50 es válido).
 * - No normaliza semánticamente unidades ni formatos.
 */
export class Presentacion {
  public static readonly LONGITUD_MAXIMA = 50;

  private readonly _valor: string;

  constructor(valor: string) {
    if (valor === null || valor === undefined) {
      throw new Error('La presentación no puede ser nula ni indefinida');
    }

    if (typeof valor !== 'string') {
      throw new Error('La presentación debe ser una cadena de texto');
    }

    const saneado = valor.trim();

    if (saneado.length === 0) {
      throw new Error('La presentación no puede estar vacía');
    }

    if (saneado.length > Presentacion.LONGITUD_MAXIMA) {
      throw new Error(
        `La presentación no puede superar los ${Presentacion.LONGITUD_MAXIMA} caracteres`,
      );
    }

    this._valor = saneado;
    Object.freeze(this);
  }

  get valor(): string {
    return this._valor;
  }

  equals(otro?: Presentacion | null): boolean {
    if (!otro || !(otro instanceof Presentacion)) {
      return false;
    }
    return this._valor === otro.valor;
  }

  static crear(valor: string): Presentacion {
    return new Presentacion(valor);
  }
}
