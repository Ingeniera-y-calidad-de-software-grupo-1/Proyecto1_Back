import { BadRequestException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { Producto } from '../../domain/entities/producto.entity';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import { ProductoMapper } from '../../mappers/producto.mapper';

describe('ProductoService - CR-002 (Presentación del Producto)', () => {
  let service: ProductoService;
  let mockRepository: any;
  let mockLineaService: any;
  let mockMarcaService: any;
  let mockProveedorService: any;
  let mockUsuarioService: any;
  let intrinsicValidationService: ProductoIntrinsicValidationService;
  let mockValidationService: any;
  let mockRelatedEntitiesValidator: any;
  let mockUniquenessValidator: any;
  let mockUsuarioValidator: any;
  let mockProductoDeletePolicy: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      updateEntity: jest.fn(),
    };
    mockLineaService = {};
    mockMarcaService = {};
    mockProveedorService = {};
    mockUsuarioService = {};
    intrinsicValidationService = new ProductoIntrinsicValidationService();
    mockValidationService = {
      validarEntidadesRelacionadas: jest.fn(),
    };
    mockRelatedEntitiesValidator = {
      validarYObtenerEntidadesRelacionadas: jest.fn().mockResolvedValue({
        marca: { id: 1, denominacion: 'Marca Test' },
        linea: { id: 2, denominacion: 'Linea Test' },
      }),
    };
    mockUniquenessValidator = {
      validarDenominacionUnica: jest.fn().mockResolvedValue(true),
      validarCodigoProveedorUnico: jest.fn().mockResolvedValue(true),
    };
    mockUsuarioValidator = {
      validarUsuarioExiste: jest.fn().mockResolvedValue({ id: 1, nombre: 'Admin' }),
    };
    mockProductoDeletePolicy = {};

    service = new ProductoService(
      mockRepository,
      mockLineaService,
      mockMarcaService,
      mockProveedorService,
      mockUsuarioService,
      intrinsicValidationService,
      mockValidationService,
      mockRelatedEntitiesValidator,
      mockUniquenessValidator,
      mockUsuarioValidator,
      mockProductoDeletePolicy,
    );
  });

  const baseCreateDto: CreateProductoDto = {
    denominacion: 'Cerveza Rubia Especial',
    marcaId: 1,
    lineaId: 2,
    costo: 1000,
    porcentaje: 15,
    stock: 50,
    alicuotaIva: AlicuotaIva.ALICUOTA_21,
    utilizaStockMinimo: false,
    utilizaPack: false,
    usuarioCreatedId: 1,
    presentacion: '1L',
  };

  describe('Creación de producto con Presentación (CR-002)', () => {
    it('TP-01 & TP-02: debe aceptar alta con presentación válida y sanear espacios', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({
          id: 1,
          denominacion: dto.denominacion,
          presentacion: dto.presentacion,
        }),
      );

      const dto = { ...baseCreateDto, presentacion: '  Botella 750 cc  ' };
      await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          presentacion: 'Botella 750 cc',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('TP-05: debe rechazar alta cuando la presentación es nula, vacía o solo espacios', async () => {
      const dtoVacio = { ...baseCreateDto, presentacion: '   ' };
      await expect(service.create(dtoVacio)).rejects.toThrow(BadRequestException);
      await expect(service.create(dtoVacio)).rejects.toThrow(
        'La presentación no puede estar vacía',
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('TP-06: debe rechazar alta con presentación de más de 50 caracteres', async () => {
      const dtoLargo = { ...baseCreateDto, presentacion: 'x'.repeat(51) };
      await expect(service.create(dtoLargo)).rejects.toThrow(BadRequestException);
      await expect(service.create(dtoLargo)).rejects.toThrow(
        'La presentación no puede superar los 50 caracteres',
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('TP-07: debe aceptar alta con presentación de exactamente 50 caracteres', async () => {
      const exactamente50 = 'p'.repeat(50);
      mockRepository.create.mockResolvedValue({
        id: 1,
        denominacion: baseCreateDto.denominacion,
        presentacion: exactamente50,
      });

      const dto = { ...baseCreateDto, presentacion: exactamente50 };
      const resultado = await service.create(dto);
      expect(resultado).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          presentacion: exactamente50,
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('Actualización de producto con Presentación (CR-002)', () => {
    const productoExistente: Producto = Object.assign(new Producto(), {
      id: 1,
      denominacion: 'Cerveza Rubia Especial',
      presentacion: '1L',
      lineaId: 2,
      marcaId: 1,
      costo: 1000,
      porcentaje: 15,
      stock: 50,
      utilizaStockMinimo: false,
      utilizaPack: false,
      alicuotaIva: AlicuotaIva.ALICUOTA_21,
    });

    beforeEach(() => {
      mockRepository.findOne.mockResolvedValue(productoExistente);
    });

    it('TP-08: debe actualizar y persistir correctamente el nuevo valor de presentación', async () => {
      mockRepository.update.mockResolvedValue({
        ...productoExistente,
        presentacion: 'Lata 473 cc',
      });

      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        presentacion: '  Lata 473 cc  ',
      };

      const resultado = await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          presentacion: 'Lata 473 cc',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
      expect(resultado).toBeDefined();
    });

    it('debe rechazar actualización con presentación vacía o solo espacios', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        presentacion: '   ',
      };

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'La presentación no puede estar vacía',
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('debe rechazar actualización con presentacion: null con BadRequestException (400) y NO con error 500', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        presentacion: null as any,
      };

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'La presentación no puede ser nula ni indefinida',
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('debe permitir actualización sin incluir presentacion (conservando la existente)', async () => {
      mockRepository.update.mockResolvedValue(productoExistente);

      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        denominacion: 'Cerveza Rubia Especial Modificada',
      };

      await service.update(1, updateDto);
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          denominacion: 'Cerveza Rubia Especial Modificada',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('TP-09: Mapeo y persistencia de Presentación', () => {
    it('debe mapear correctamente presentacion en toDto y toBusquedaDto', () => {
      const producto = Object.assign(new Producto(), {
        id: 10,
        denominacion: 'Aceite de Oliva',
        presentacion: '500 cc',
        costo: 500,
        precio: 600,
        porcentaje: 20,
        stock: 15,
        alicuotaIva: 21,
        utilizaStockMinimo: false,
        utilizaPack: false,
        linea: { id: 1, denominacion: 'Aceites' } as any,
        marca: { id: 1, denominacion: 'Cocinero' } as any,
      });

      const dto = ProductoMapper.toDto(producto);
      expect(dto.presentacion).toBe('500 cc');

      const busquedaDto = ProductoMapper.toBusquedaDto(producto);
      expect(busquedaDto.presentacion).toBe('500 cc');
    });

    it('debe mapear fielmente "Sin especificar" cuando el producto legacy fue regularizado por la migración', () => {
      const productoLegacy = Object.assign(new Producto(), {
        id: 11,
        denominacion: 'Producto Antiguo',
        presentacion: 'Sin especificar',
        costo: 100,
        precio: 120,
        porcentaje: 20,
        stock: 5,
        alicuotaIva: 21,
        utilizaStockMinimo: false,
        utilizaPack: false,
        linea: { id: 1, denominacion: 'General' } as any,
        marca: { id: 1, denominacion: 'Generica' } as any,
      });

      const dto = ProductoMapper.toDto(productoLegacy);
      expect(dto.presentacion).toBe('Sin especificar');

      const busquedaDto = ProductoMapper.toBusquedaDto(productoLegacy);
      expect(busquedaDto.presentacion).toBe('Sin especificar');
    });
  });

  describe('TP-12: Regresión de funcionalidades no relacionadas (Pack y Stock Crítico)', () => {
    it('las funcionalidades de pack y stock crítico deben mantenerse intactas en Producto', () => {
      const producto = new Producto();
      producto.utilizaPack = true;
      producto.cantidadPorPack = 6;
      producto.utilizaStockMinimo = true;
      producto.stockMinimo = 20;
      producto.presentacion = 'Pack 6x 354 cc';

      expect(producto.utilizaPack).toBe(true);
      expect(producto.cantidadPorPack).toBe(6);
      expect(producto.utilizaStockMinimo).toBe(true);
      expect(producto.stockMinimo).toBe(20);
      expect(producto.presentacion).toBe('Pack 6x 354 cc');
    });
  });
});
