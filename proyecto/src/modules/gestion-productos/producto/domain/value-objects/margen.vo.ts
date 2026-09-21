/**
 * Value Object: Margen
 * Representa el porcentaje de ganancia aplicado sobre el costo para obtener el precio de venta.
 * Es inmutable, carece de identidad conceptual y valida que el porcentaje no sea negativo.
 * Contempla 15% como valor por defecto del dominio cuando no se especifica.
 */
export class Margen {
  public static readonly VALOR_POR_DEFECTO = 15;

  private readonly _valor: number;

  constructor(valor?: number | null) {
    const valorFinal = valor ?? Margen.VALOR_POR_DEFECTO;

    if (typeof valorFinal !== 'number' || isNaN(valorFinal) || !isFinite(valorFinal)) {
      throw new Error('El margen debe ser un número válido');
    }

    if (valorFinal < 0) {
      throw new Error('El margen no puede ser negativo');
    }

    this._valor = valorFinal;
    Object.freeze(this);
  }

  get valor(): number {
    return this._valor;
  }

  equals(otro?: Margen | null): boolean {
    if (!otro || !(otro instanceof Margen)) {
      return false;
    }
    return this._valor === otro.valor;
  }

  static porDefecto(): Margen {
    return new Margen(Margen.VALOR_POR_DEFECTO);
  }

  static crear(valor?: number | null): Margen {
    return new Margen(valor);
  }
}
