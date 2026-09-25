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
      presentacion: '1L',
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

    it('TP-05: debe rechazar cuando falta presentación en CreateProductoDto', async () => {
      const payloadSinPres = { ...validPayload };
      delete (payloadSinPres as any).presentacion;
      const dto = plainToInstance(CreateProductoDto, payloadSinPres);
      const errors = await validate(dto);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeDefined();
    });

    it('debe rechazar presentación vacía o solo espacios en CreateProductoDto', async () => {
      const dtoVacio = plainToInstance(CreateProductoDto, {
        ...validPayload,
        presentacion: '   ',
      });
      const errors = await validate(dtoVacio);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeDefined();
      expect(presError?.constraints?.isNotEmpty).toBe('La presentación es obligatoria.');
    });

    it('debe rechazar presentación > 50 caracteres en CreateProductoDto', async () => {
      const dtoLargo = plainToInstance(CreateProductoDto, {
        ...validPayload,
        presentacion: 'a'.repeat(51),
      });
      const errors = await validate(dtoLargo);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeDefined();
      expect(presError?.constraints?.maxLength).toBe(
        'La presentación no puede superar los 50 caracteres.',
      );
    });

    it('TP-07: debe aceptar presentación con exactamente 50 caracteres en CreateProductoDto', async () => {
      const dtoExacto = plainToInstance(CreateProductoDto, {
        ...validPayload,
        presentacion: 'a'.repeat(50),
      });
      const errors = await validate(dtoExacto);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeUndefined();
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

    it('debe aceptar presentación válida opcional en UpdateProductoDto', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        presentacion: 'Botella 750 cc',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar presentación vacía o solo espacios en UpdateProductoDto', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        presentacion: '   ',
      });
      const errors = await validate(dto);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeDefined();
      expect(presError?.constraints?.isNotEmpty).toBe('La presentación no puede estar vacía.');
    });

    it('debe rechazar presentación > 50 caracteres en UpdateProductoDto', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        presentacion: 'x'.repeat(51),
      });
      const errors = await validate(dto);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeDefined();
      expect(presError?.constraints?.maxLength).toBe(
        'La presentación no puede superar los 50 caracteres.',
      );
    });

    it('debe rechazar explícitamente presentacion: null en UpdateProductoDto', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        presentacion: null,
      });
      const errors = await validate(dto);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeDefined();
      expect(presError?.constraints?.isString).toBe('La presentación debe ser una cadena de texto.');
    });

    it('debe aceptar UpdateProductoDto cuando presentacion es undefined (campo no enviado)', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
      });
      const errors = await validate(dto);
      const presError = errors.find((e) => e.property === 'presentacion');
      expect(presError).toBeUndefined();
      expect(errors.length).toBe(0);
    });

    it('CR-005: debe aceptar UpdateProductoDto cuando denominacion es undefined (conserva persistida)', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
      });
      const errors = await validate(dto);
      const denError = errors.find((e) => e.property === 'denominacion');
      expect(denError).toBeUndefined();
    });

    it('CR-005: debe rechazar UpdateProductoDto con denominacion null', async () => {
      const dto = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        denominacion: null,
      });
      const errors = await validate(dto);
      const denError = errors.find((e) => e.property === 'denominacion');
      expect(denError).toBeDefined();
    });

    it('CR-005: debe rechazar UpdateProductoDto con denominacion vacía o solo espacios', async () => {
      const dtoVacio = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        denominacion: '',
      });
      const errorsVacio = await validate(dtoVacio);
      expect(errorsVacio.find((e) => e.property === 'denominacion')).toBeDefined();

      const dtoEspacios = plainToInstance(UpdateProductoDto, {
        usuarioUpdatedId: 1,
        denominacion: '   ',
      });
      const errorsEspacios = await validate(dtoEspacios);
      expect(errorsEspacios.find((e) => e.property === 'denominacion')).toBeDefined();
    });
  });

  describe('CreateProductoDto - CR-005 Fallback de denominación', () => {
    const validBase = {
      marcaId: 1,
      lineaId: 2,
      costo: 150,
      porcentaje: 25,
      stock: 100,
      utilizaStockMinimo: false,
      utilizaPack: false,
      alicuotaIva: AlicuotaIva.ALICUOTA_21,
      usuarioCreatedId: 1,
      presentacion: '1L',
    };

    it('debe aceptar CreateProductoDto sin denominacion (undefined para fallback)', async () => {
      const dto = plainToInstance(CreateProductoDto, validBase);
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'denominacion')).toBeUndefined();
    });

    it('debe aceptar CreateProductoDto con denominacion null (para fallback)', async () => {
      const dto = plainToInstance(CreateProductoDto, { ...validBase, denominacion: null });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'denominacion')).toBeUndefined();
    });

    it('debe aceptar CreateProductoDto con denominacion vacía (para fallback)', async () => {
      const dto = plainToInstance(CreateProductoDto, { ...validBase, denominacion: '' });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'denominacion')).toBeUndefined();
    });

    it('debe aceptar CreateProductoDto con denominacion de solo espacios (para fallback)', async () => {
      const dto = plainToInstance(CreateProductoDto, { ...validBase, denominacion: '   ' });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'denominacion')).toBeUndefined();
    });

    it('debe rechazar CreateProductoDto con denominacion que no sea string', async () => {
      const dto = plainToInstance(CreateProductoDto, { ...validBase, denominacion: 12345 });
      const errors = await validate(dto);
      const denError = errors.find((e) => e.property === 'denominacion');
      expect(denError).toBeDefined();
      expect(denError?.constraints?.isString).toBe('La denominación debe ser una cadena de texto.');
    });
  });
});


