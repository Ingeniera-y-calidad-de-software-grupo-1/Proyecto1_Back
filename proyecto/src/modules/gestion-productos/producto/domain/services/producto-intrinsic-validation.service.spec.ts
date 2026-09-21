import { BadRequestException } from '@nestjs/common';
import { ProductoIntrinsicValidationService } from './producto-intrinsic-validation.service.ts';

describe('ProductoIntrinsicValidationService (CR-001)', () => {
  let service: ProductoIntrinsicValidationService;

  beforeEach(() => {
    service = new ProductoIntrinsicValidationService();
  });

  const baseValidData = {
    denominacion: 'Tornillo de Acero 1/2',
    marcaId: 1,
    lineaId: 2,
    costo: 100,
    porcentaje: 20,
    stock: 50,
    utilizaStockMinimo: true,
    stockMinimo: 5,
  };

  describe('validarDatosBasicos', () => {
    it('debe aceptar datos válidos', () => {
      expect(() => service.validarDatosBasicos(baseValidData)).not.toThrow();
    });

    it('debe rechazar denominación vacía o con solo espacios', () => {
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, denominacion: '' }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, denominacion: '   ' }),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar denominación que supere los 255 caracteres', () => {
      const larga = 'a'.repeat(256);
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, denominacion: larga }),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar costo negativo', () => {
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, costo: -1 }),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, costo: -0.01 }),
      ).toThrow('El costo no puede ser negativo');
    });

    it('debe rechazar porcentaje negativo', () => {
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, porcentaje: -5 }),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, porcentaje: -10 }),
      ).toThrow('El porcentaje no puede ser negativo');
    });

    it('debe rechazar stock negativo', () => {
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, stock: -1 }),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, stock: -0.5 }),
      ).toThrow('El stock no puede ser negativo');
    });

    it('debe rechazar stockMinimo negativo', () => {
      expect(() =>
        service.validarDatosBasicos({ ...baseValidData, stockMinimo: -1 }),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar si utilizaStockMinimo es true pero no se provee stockMinimo válido', () => {
      expect(() =>
        service.validarDatosBasicos({
          ...baseValidData,
          utilizaStockMinimo: true,
          stockMinimo: undefined,
        }),
      ).toThrow('Debe especificar un stock mínimo válido cuando utiliza stock mínimo');
    });

    it('debe permitir stockMinimo undefined si utilizaStockMinimo es false', () => {
      expect(() =>
        service.validarDatosBasicos({
          ...baseValidData,
          utilizaStockMinimo: false,
          stockMinimo: undefined,
        }),
      ).not.toThrow();
    });

    it('debe permitir costo = 0, porcentaje = 0, stock = 0', () => {
      expect(() =>
        service.validarDatosBasicos({
          ...baseValidData,
          costo: 0,
          porcentaje: 0,
          stock: 0,
          stockMinimo: 0,
        }),
      ).not.toThrow();
    });
  });
});
