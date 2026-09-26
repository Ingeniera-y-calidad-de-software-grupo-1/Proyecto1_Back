import { BadRequestException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { Producto } from '../../domain/entities/producto.entity';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';

describe('ProductoService - CR-001 (Etapa 2)', () => {
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
      {} as any,
    );
  });

  describe('CREACIÓN', () => {
    const validCreateDto: CreateProductoDto = {
      denominacion: 'Producto Test',
      marcaId: 1,
      lineaId: 2,
      costo: 1000,
      porcentaje: 15,
      stock: 10,
      alicuotaIva: AlicuotaIva.ALICUOTA_21,
      utilizaStockMinimo: false,
      utilizaPack: false,
      usuarioCreatedId: 1,
      presentacion: '1L',
    };

    it('debe rechazar costo negativo', async () => {
      const dto = { ...validCreateDto, costo: -100 };
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('El costo no puede ser negativo');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('debe rechazar porcentaje negativo', async () => {
      const dto = { ...validCreateDto, porcentaje: -5 };
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('El porcentaje no puede ser negativo');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('debe rechazar stock negativo', async () => {
      const dto = { ...validCreateDto, stock: -1 };
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('El stock no puede ser negativo');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('debe aceptar datos válidos y persistir entidad', async () => {
      mockRepository.create.mockResolvedValue({
        id: 1,
        denominacion: validCreateDto.denominacion,
      });

      const result = await service.create({ ...validCreateDto });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe calcular el precio automáticamente a partir de costo y porcentaje', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({ id: 1, denominacion: dto.denominacion, precio: dto.precio }),
      );

      const dto = { ...validCreateDto, costo: 1000, porcentaje: 15 };
      await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          costo: 1000,
          porcentaje: 15,
          precio: 1150, // 1000 * (1 + 15/100) = 1150
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('precio enviado manualmente no debe prevalecer (se sobreescribe con el calculado)', async () => {
      mockRepository.create.mockImplementation((dto) =>
        Promise.resolve({ id: 1, denominacion: dto.denominacion, precio: dto.precio }),
      );

      const dto = { ...validCreateDto, costo: 1000, porcentaje: 15, precio: 99999 };
      await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          costo: 1000,
          porcentaje: 15,
          precio: 1150, // Ignoró 99999 y usó 1150
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('ACTUALIZACIÓN', () => {
    let productoExistente: Producto;

    beforeEach(() => {
      productoExistente = new Producto();
      productoExistente.id = 1;
      productoExistente.denominacion = 'Producto Existente';
      productoExistente.marcaId = 1;
      productoExistente.lineaId = 2;
      productoExistente.costo = 1000;
      productoExistente.porcentaje = 15;
      productoExistente.precio = 1150;
      productoExistente.stock = 20;
      productoExistente.utilizaStockMinimo = false;

      mockRepository.findOne.mockResolvedValue(productoExistente);
      mockRepository.update.mockImplementation((id, dto) =>
        Promise.resolve({ id, denominacion: dto.denominacion ?? productoExistente.denominacion }),
      );
    });

    it('cambio de costo recalcula precio usando porcentaje existente', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        costo: 1200,
        motivoCambioPrecio: 'Aumento de costo',
      };

      await service.update(1, updateDto);

      // costo 1200 * (1 + 15/100) = 1380
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          costo: 1200,
          precio: 1380,
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('cambio de porcentaje recalcula precio usando costo existente', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        porcentaje: 20,
        motivoCambioPrecio: 'Aumento de porcentaje',
      };

      await service.update(1, updateDto);

      // costo 1000 * (1 + 20/100) = 1200
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          porcentaje: 20,
          precio: 1200,
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('cambio simultáneo de costo y porcentaje recalcula correctamente', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        costo: 2000,
        porcentaje: 10,
        motivoCambioPrecio: 'Ajuste conjunto',
      };

      await service.update(1, updateDto);

      // costo 2000 * (1 + 10/100) = 2200
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          costo: 2000,
          porcentaje: 10,
          precio: 2200,
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('update que no modifica costo ni margen conserva coherencia y no altera el cálculo', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        denominacion: 'Nueva Denominacion Valida',
      };

      await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          denominacion: 'Nueva Denominacion Valida',
          precio: 1150,
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('precio manual en UpdateDto es sobrescrito por el precio calculado', async () => {
      const updateDto: UpdateProductoDto = {
        usuarioUpdatedId: 1,
        costo: 1000,
        porcentaje: 15,
        precio: 88888, // Intentando forzar precio manual
      };

      await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          precio: 1150,
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('STOCK', () => {
    let dummyUow: IUnitOfWork;

    beforeEach(() => {
      dummyUow = {} as IUnitOfWork;
    });

    it('incremento válido suma la cantidad y persiste el nuevo stock', async () => {
      const producto = new Producto();
      producto.id = 1;
      producto.stock = 10;
      mockRepository.findOne.mockResolvedValue(producto);

      const nuevoStock = await service.incrementarStock(dummyUow, 1, 5, 'RECEPCION');

      expect(nuevoStock).toBe(15);
      expect(producto.stock).toBe(15);
      expect(mockRepository.updateEntity).toHaveBeenCalledWith(dummyUow, producto);
    });

    it('decremento válido resta la cantidad y persiste el nuevo stock', async () => {
      const producto = new Producto();
      producto.id = 1;
      producto.stock = 10;
      mockRepository.findOne.mockResolvedValue(producto);

      const nuevoStock = await service.decrementarStock(dummyUow, 1, 4, 'VENTA');

      expect(nuevoStock).toBe(6);
      expect(producto.stock).toBe(6);
      expect(mockRepository.updateEntity).toHaveBeenCalledWith(dummyUow, producto);
    });

    it('stock puede quedar exactamente en 0', async () => {
      const producto = new Producto();
      producto.id = 1;
      producto.stock = 10;
      mockRepository.findOne.mockResolvedValue(producto);

      const nuevoStock = await service.decrementarStock(dummyUow, 1, 10, 'VENTA_TOTAL');

      expect(nuevoStock).toBe(0);
      expect(producto.stock).toBe(0);
      expect(mockRepository.updateEntity).toHaveBeenCalledWith(dummyUow, producto);
    });

    it('stock resultante negativo se rechaza con BadRequestException, sin mutar stock ni llamar repository', async () => {
      const producto = new Producto();
      producto.id = 1;
      producto.stock = 5;
      mockRepository.findOne.mockResolvedValue(producto);

      await expect(
        service.decrementarStock(dummyUow, 1, 10, 'VENTA_EXCESIVA'),
      ).rejects.toThrow(BadRequestException);

      // El stock del producto no debe modificarse
      expect(producto.stock).toBe(5);
      // updateEntity no debe haber sido llamado
      expect(mockRepository.updateEntity).not.toHaveBeenCalled();
    });
  });
});
