/**
 * Value Object: Precio
 * Representa el importe monetario de precio de venta.
 * Es inmutable, carece de identidad conceptual y valida que el valor sea un número finito no negativo.
 * Conserva el valor calculado sin transformaciones arbitrarias.
 */
export class Precio {
  private readonly _valor: number;

  constructor(valor: number) {
    if (typeof valor !== 'number' || isNaN(valor) || !isFinite(valor)) {
      throw new Error('El precio debe ser un número válido');
    }

    if (valor <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }

    this._valor = valor;
    Object.freeze(this);
  }

  get valor(): number {
    return this._valor;
  }

  equals(otro?: Precio | null): boolean {
    if (!otro || !(otro instanceof Precio)) {
      return false;
    }
    return this._valor === otro.valor;
  }

  static crear(valor: number): Precio {
    return new Precio(valor);
  }
}
