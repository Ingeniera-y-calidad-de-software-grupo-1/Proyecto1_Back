import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductoDto } from './create-producto.dto';
import { UpdateProductoDto } from './update-producto.dto';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';

describe('Producto DTOs - Validaciones CR-001', () => {
  describe('CreateProductoDto', () => {
    const validPayload = {
      denominacion: 'Arandela de Presión 3/8',
      marcaId: 1,
      lineaId: 2,
      costo: 150,
      porcentaje: 25,
      stock: 100,
      utilizaStockMinimo: false,
      utilizaPack: false,
      alicuotaIva: AlicuotaIva.ALICUOTA_21,
      usuarioCreatedId: 1,
    };

    it('debe ser válido con datos correctos', async () => {
      const dto = plainToInstance(CreateProductoDto, validPayload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar costo negativo', async () => {
      const dto = plainToInstance(CreateProductoDto, { ...validPayload, costo: -10 });
      const errors = await validate(dto);
      const costoError = errors.find((e) => e.property === 'costo');
      expect(costoError).toBeDefined();
      expect(costoError?.constraints?.min).toBe('El costo no puede ser negativo.');
    });

    it('debe rechazar porcentaje negativo', async () => {
      const dto = plainToInstance(CreateProductoDto, { ...validPayload, porcentaje: -1 });
      const errors = await validate(dto);
      const porcentajeError = errors.find((e) => e.property === 'porcentaje');
      expect(porcentajeError).toBeDefined();
      expect(porcentajeError?.constraints?.min).toBe('El porcentaje no puede ser negativo.');
    });

    it('debe rechazar stock negativo', async () => {
      const dto = plainToInstance(CreateProductoDto, { ...validPayload, stock: -5 });
      const errors = await validate(dto);
      const stockError = errors.find((e) => e.property === 'stock');
      expect(stockError).toBeDefined();
      expect(stockError?.constraints?.min).toBe('El stock no puede ser negativo.');
    });

    it('debe rechazar denominación que supere 255 caracteres', async () => {
      const dto = plainToInstance(CreateProductoDto, {
        ...validPayload,
        denominacion: 'a'.repeat(256),
      });
      const errors = await validate(dto);
      const denError = errors.find((e) => e.property === 'denominacion');
      expect(denError).toBeDefined();
      expect(denError?.constraints?.maxLength).toBe(
        'La denominación no puede superar 255 caracteres.',
      );
    });
  });

  describe('UpdateProductoDto', () => {
    it('debe validar denominación opcional válida', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        denominacion: 'Tuerca Hexagonal 1/2',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar denominación que supere 255 caracteres', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        denominacion: 'a'.repeat(256),
      });
      const errors = await validate(dto);
      const denError = errors.find((e) => e.property === 'denominacion');
      expect(denError).toBeDefined();
      expect(denError?.constraints?.maxLength).toBe(
        'La denominación no puede superar 255 caracteres.',
      );
    });

    it('debe rechazar costo negativo en update', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        costo: -50,
      });
      const errors = await validate(dto);
      const costoError = errors.find((e) => e.property === 'costo');
      expect(costoError).toBeDefined();
      expect(costoError?.constraints?.min).toBe('El costo no puede ser negativo.');
    });

    it('debe rechazar porcentaje negativo en update', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        porcentaje: -10,
      });
      const errors = await validate(dto);
      const porcentajeError = errors.find((e) => e.property === 'porcentaje');
      expect(porcentajeError).toBeDefined();
      expect(porcentajeError?.constraints?.min).toBe('El porcentaje no puede ser negativo.');
    });
  });
});
