// domain/services/producto-intrinsic-validation.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ProductoIntrinsicValidationService {
  /**
   * Valida todos los datos intrínsecos del producto
   */
  validarDatosBasicos(datos: {
    denominacion: string;
    marcaId: number;
    lineaId: number;
    costo?: number;
    porcentaje?: number;
    stock?: number;
    utilizaStockMinimo?: boolean;
    stockMinimo?: number;
    alicuotaIva?: number;
  }): void {
    this.validarDenominacion(datos.denominacion);
    this.validarIds(datos.marcaId, datos.lineaId);
    this.validarCosto(datos.costo);
    this.validarPorcentaje(datos.porcentaje);
    this.validarStock(datos.stock);
    this.validarStockMinimo(datos.utilizaStockMinimo, datos.stockMinimo);

    if (datos.alicuotaIva !== undefined) {
      this.validarAlicuotaIva(datos.alicuotaIva);
    }
  }

  private validarDenominacion(denominacion: string): void {
    if (!denominacion || denominacion.trim().length === 0) {
      throw new BadRequestException('La denominación es obligatoria');
    }
    if (denominacion.length > 255) {
      throw new BadRequestException(
        'La denominación no puede superar 255 caracteres',
      );
    }
  }

  private validarIds(
    marcaId: number,
    lineaId: number,
  ): void {
    if (!marcaId || marcaId <= 0) {
      throw new BadRequestException('Marca ID es requerido y debe ser válido');
    }
    if (!lineaId || lineaId <= 0) {
      throw new BadRequestException('Línea ID es requerido y debe ser válido');
    }
  }

  private validarCosto(costo?: number): void {
    if (costo !== undefined && costo !== null) {
      if (typeof costo !== 'number' || isNaN(costo) || !isFinite(costo)) {
        throw new BadRequestException('El costo debe ser un número válido');
      }
      if (costo < 0) {
        throw new BadRequestException('El costo no puede ser negativo');
      }
    }
  }

  private validarPorcentaje(porcentaje?: number): void {
    if (porcentaje !== undefined && porcentaje !== null) {
      if (typeof porcentaje !== 'number' || isNaN(porcentaje) || !isFinite(porcentaje)) {
        throw new BadRequestException('El porcentaje debe ser un número válido');
      }
      if (porcentaje < 0) {
        throw new BadRequestException('El porcentaje no puede ser negativo');
      }
    }
  }

  private validarStock(stock?: number): void {
    if (stock !== undefined && stock !== null) {
      if (typeof stock !== 'number' || isNaN(stock) || !isFinite(stock)) {
        throw new BadRequestException('El stock debe ser un número válido');
      }
      if (stock < 0) {
        throw new BadRequestException('El stock no puede ser negativo');
      }
    }
  }

  private validarStockMinimo(
    utilizaStockMinimo?: boolean,
    stockMinimo?: number,
  ): void {
    if (stockMinimo !== undefined && stockMinimo !== null) {
      if (typeof stockMinimo !== 'number' || isNaN(stockMinimo) || !isFinite(stockMinimo)) {
        throw new BadRequestException('El stock mínimo debe ser un número válido');
      }
      if (stockMinimo < 0) {
        throw new BadRequestException('El stock mínimo no puede ser negativo');
      }
    }

    if (utilizaStockMinimo) {
      if (stockMinimo === undefined || stockMinimo === null || isNaN(stockMinimo)) {
        throw new BadRequestException(
          'Debe especificar un stock mínimo válido cuando utiliza stock mínimo',
        );
      }
    }
  }

  private validarAlicuotaIva(alicuotaIva: number): void {
    if (alicuotaIva < 0 || alicuotaIva > 100) {
      throw new BadRequestException(
        'La alícuota IVA debe estar entre 0 y 100',
      );
    }
  }
}