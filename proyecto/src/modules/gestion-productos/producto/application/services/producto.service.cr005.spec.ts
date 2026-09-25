import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { Producto } from '../../domain/entities/producto.entity';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';

describe('ProductoService - CR-005 (Denominación Automática de Producto)', () => {
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
        marca: { id: 1, denominacion: 'Coca-Cola' },
        linea: { id: 2, denominacion: 'Gaseosas' },
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
    marcaId: 1,
    lineaId: 2,
    presentacion: '1.5L',
    costo: 1000,
    porcentaje: 20,
    stock: 50,
    alicuotaIva: AlicuotaIva.ALICUOTA_21,
    utilizaStockMinimo: false,
    utilizaPack: false,
    usuarioCreatedId: 1,
  };

  describe('Creación de producto (Fallback vs Override)', () => {
    it('TP-05: Create sin denominación (undefined) => autocompone Marca + Línea + Presentación antes de persistir', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({
          id: 1,
          denominacion: dto.denominacion,
          presentacion: dto.presentacion,
        }),
      );

      const dto = { ...baseCreateDto };
      delete (dto as any).denominacion;

      await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: 'Coca-Cola Gaseosas 1.5L',
          presentacion: '1.5L',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('TP-05b: Create con denominación vacía o de solo espacios => autocompone antes de persistir', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({
          id: 1,
          denominacion: dto.denominacion,
        }),
      );

      // Denominación vacía
      await service.create({ ...baseCreateDto, denominacion: '' });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: 'Coca-Cola Gaseosas 1.5L',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );

      // Denominación con solo espacios
      await service.create({ ...baseCreateDto, denominacion: '     ' });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: 'Coca-Cola Gaseosas 1.5L',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );

      // Denominación null
      await service.create({ ...baseCreateDto, denominacion: null as any });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: 'Coca-Cola Gaseosas 1.5L',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('TP-06: Create con denominación manual => conserva y valida el override enviado', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({
          id: 1,
          denominacion: dto.denominacion,
        }),
      );

      const dto = {
        ...baseCreateDto,
        denominacion: 'Coca-Cola Edición Especial 1.5L',
      };

      await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: 'Coca-Cola Edición Especial 1.5L',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('TP-10: La verificación de unicidad se ejecuta sobre la denominación final compuesta', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({
          id: 1,
          denominacion: dto.denominacion,
        }),
      );

      const dto = { ...baseCreateDto }; // denominacion omitida
      await service.create(dto);

      // La validación de unicidad debe haber sido llamada con la denominación autocompuesta
      expect(mockUniquenessValidator.validarDenominacionUnica).toHaveBeenCalledWith(
        'Coca-Cola Gaseosas 1.5L',
      );
    });

    it('TP-08: Marca inexistente durante fallback => error controlado (NotFoundException)', async () => {
      mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockRejectedValue(
        new NotFoundException('Marca con ID 999 no encontrada'),
      );

      const dto = { ...baseCreateDto, marcaId: 999 };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow('Marca con ID 999 no encontrada');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('TP-09: Línea inexistente durante fallback => error controlado (NotFoundException)', async () => {
      mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockRejectedValue(
        new NotFoundException('Línea con ID 999 no encontrada'),
      );

      const dto = { ...baseCreateDto, lineaId: 999 };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow('Línea con ID 999 no encontrada');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('No debe mutar directamente el DTO recibido durante create', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({ id: 1, denominacion: dto.denominacion }),
      );

      const dtoOriginal: CreateProductoDto = { ...baseCreateDto };
      Object.freeze(dtoOriginal); // Si el service mutara dtoOriginal, arrojaría error

      await expect(service.create(dtoOriginal)).resolves.toBeDefined();
    });
  });

  describe('Actualización de producto (Update)', () => {
    const productoExistente: Producto = Object.assign(new Producto(), {
      id: 1,
      denominacion: 'Coca-Cola Original 1.5L',
      presentacion: '1.5L',
      lineaId: 2,
      marcaId: 1,
      costo: 1000,
      porcentaje: 20,
      stock: 50,
      utilizaStockMinimo: false,
      utilizaPack: false,
      alicuotaIva: AlicuotaIva.ALICUOTA_21,
    });

    beforeEach(() => {
      mockRepository.findOne.mockResolvedValue(productoExistente);
    });

    it('TP-07: Update sin denominación => conserva el valor existente y no autocompone implícitamente', async () => {
      mockRepository.update.mockResolvedValue(productoExistente);

      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        costo: 1200,
      };

      await service.update(1, updateDto);

      // No debe inventar ni enviar denominacion en los datos si no venía en el DTO
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({
          denominacion: expect.anything(),
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('Update con denominación manual => actualiza y valida la nueva denominación', async () => {
      mockRepository.update.mockResolvedValue({
        ...productoExistente,
        denominacion: 'Coca-Cola Sabor Original 1.5L',
      });

      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        denominacion: '  Coca-Cola Sabor Original 1.5L  ',
      };

      await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          denominacion: 'Coca-Cola Sabor Original 1.5L',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('Update con denominación vacía => lanza BadRequestException', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        denominacion: '   ',
      };

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'La denominación no puede estar vacía',
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});
