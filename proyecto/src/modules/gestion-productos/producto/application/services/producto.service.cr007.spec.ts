import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { Producto } from '../../domain/entities/producto.entity';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { UpdateProductoDto } from '../../dto/update-producto.dto';

describe('ProductoService - CR-007 Historial de Precios', () => {
  let service: ProductoService;
  let mockRepository: any;
  let mockHistorialPrecioRepository: any;
  let mockRelatedEntitiesValidator: any;
  let mockIntrinsicValidationService: any;
  let mockValidationService: any;
  let mockUniquenessValidator: any;
  let mockUsuarioValidator: any;

  const mockProductoExistente = (precio: number, costo: number = 100, porcentaje: number = 21): Producto => {
    const p = new Producto();
    p.id = 1;
    p.denominacion = 'Producto Test';
    p.presentacion = 'Unidad';
    p.precio = precio;
    p.costo = costo;
    p.porcentaje = porcentaje;
    p.stock = 10;
    p.stockMinimo = 5;
    p.utilizaStockMinimo = true;
    p.alicuotaIva = 21;
    p.lineaId = 1;
    p.marcaId = 1;
    return p;
  };

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    mockHistorialPrecioRepository = {
      guardar: jest.fn(),
      findByProductoId: jest.fn(),
    };

    mockRelatedEntitiesValidator = {
      validarYObtenerEntidadesRelacionadas: jest.fn().mockResolvedValue({
        marca: { id: 1 },
        linea: { id: 1 },
      }),
    };

    mockIntrinsicValidationService = {
      validarDatosBasicos: jest.fn(),
    };

    mockValidationService = {
      validarEntidadesRelacionadas: jest.fn(),
    };

    mockUniquenessValidator = {
      validarDenominacionUnica: jest.fn().mockResolvedValue(undefined),
    };

    mockUsuarioValidator = {
      validarUsuarioExiste: jest.fn().mockResolvedValue({ id: 99 }),
    };

    service = new ProductoService(
      mockRepository,
      {} as any, // lineaService
      {} as any, // marcaService
      {} as any, // proveedorService
      {} as any, // usuarioService
      mockIntrinsicValidationService,
      mockValidationService,
      mockRelatedEntitiesValidator,
      mockUniquenessValidator,
      mockUsuarioValidator,
      {} as any, // productoDeletePolicy
      mockHistorialPrecioRepository,
    );
  });

  describe('validación de cambio de precio y motivo obligatorio (RN-CR007-02, RN-CR007-03)', () => {
    it('TP-CR007-01: debe permitir actualizar producto con cambio efectivo de precio cuando se provee motivo válido', async () => {
      // Precio anterior: 121 (costo 100, margen 21%)
      const productoActual = mockProductoExistente(121, 100, 21);
      mockRepository.findOne.mockResolvedValue(productoActual);
      mockRepository.update.mockImplementation(async (_id, _data, _linea, _marca, _usuario, historial) => {
        return {
          id: 1,
          denominacion: 'Producto Test',
          historial,
        };
      });

      const dto: UpdateProductoDto = {
        costo: 120, // nuevo precio será 120 * 1.21 = 145.2
        porcentaje: 21,
        motivoCambioPrecio: 'Aumento de costo de reposición del proveedor',
        usuarioUpdatedId: 99,
      };

      const result = await service.update(1, dto);

      expect(result).toBeDefined();
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      const passedHistorial: HistorialPrecio = mockRepository.update.mock.calls[0][5];
      expect(passedHistorial).toBeDefined();
      expect(passedHistorial.productoId).toBe(1);
      expect(passedHistorial.precioAnterior).toBe(121);
      expect(passedHistorial.precioNuevo).toBe(145.2);
      expect(passedHistorial.motivo).toBe('Aumento de costo de reposición del proveedor');
    });

    it('TP-CR007-07: debe lanzar BadRequestException si el precio cambia pero no se envía motivo', async () => {
      const productoActual = mockProductoExistente(121, 100, 21);
      mockRepository.findOne.mockResolvedValue(productoActual);

      const dto: UpdateProductoDto = {
        costo: 120, // produce nuevo precio 145.2 !== 121
        porcentaje: 21,
        usuarioUpdatedId: 99,
      };

      await expect(service.update(1, dto)).rejects.toThrow(
        new BadRequestException('Debe ingresar un motivo para el cambio de precio'),
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('TP-CR007-07b: debe lanzar BadRequestException si el motivo está compuesto solo de espacios en blanco', async () => {
      const productoActual = mockProductoExistente(121, 100, 21);
      mockRepository.findOne.mockResolvedValue(productoActual);

      const dto: UpdateProductoDto = {
        costo: 150,
        porcentaje: 21,
        motivoCambioPrecio: '     ',
        usuarioUpdatedId: 99,
      };

      await expect(service.update(1, dto)).rejects.toThrow(
        new BadRequestException('Debe ingresar un motivo para el cambio de precio'),
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('TP-CR007-08: no debe exigir motivo ni generar historial si el precio no cambia efectivamente', async () => {
      // Costo 100 y margen 21 -> precio 121. Se envían los mismos valores.
      const productoActual = mockProductoExistente(121, 100, 21);
      mockRepository.findOne.mockResolvedValue(productoActual);
      mockRepository.update.mockResolvedValue({ id: 1, denominacion: 'Producto Test' });

      const dto: UpdateProductoDto = {
        costo: 100,
        porcentaje: 21,
        presentacion: 'Caja x 10',
        usuarioUpdatedId: 99,
      };

      const result = await service.update(1, dto);

      expect(result).toBeDefined();
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      const passedHistorial = mockRepository.update.mock.calls[0][5];
      expect(passedHistorial).toBeUndefined();
    });

    it('TP-CR007-08b: debe respetar la precisión de 5 decimales (redondear5)', async () => {
      // Precio anterior: 10.12345
      const productoActual = mockProductoExistente(10.12345, 10.12345, 0);
      mockRepository.findOne.mockResolvedValue(productoActual);
      mockRepository.update.mockResolvedValue({ id: 1, denominacion: 'Producto Test' });

      // Diferencia en el 6to decimal (10.123454 redondeado a 5 decimales es 10.12345)
      const dtoSinCambioEfectivo: UpdateProductoDto = {
        costo: 10.123454,
        porcentaje: 0,
        usuarioUpdatedId: 99,
      };

      await service.update(1, dtoSinCambioEfectivo);
      expect(mockRepository.update.mock.calls[0][5]).toBeUndefined();

      // Diferencia en el 5to decimal (10.12346 !== 10.12345) -> sí constituye cambio efectivo
      const dtoConCambioEfectivo: UpdateProductoDto = {
        costo: 10.12346,
        porcentaje: 0,
        usuarioUpdatedId: 99,
      };

      await expect(service.update(1, dtoConCambioEfectivo)).rejects.toThrow(
        new BadRequestException('Debe ingresar un motivo para el cambio de precio'),
      );
    });
  });

  describe('obtenerHistorialPrecios (RN-CR007-05, RN-CR007-06)', () => {
    it('TP-CR007-12: debe retornar el historial ordenado por fecha DESC si el producto existe', async () => {
      const producto = mockProductoExistente(100);
      mockRepository.findOne.mockResolvedValue(producto);

      const historialMock: HistorialPrecio[] = [
        {
          id: 2,
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 150,
          fecha: new Date('2026-03-02'),
          motivo: 'Segundo aumento',
        } as HistorialPrecio,
        {
          id: 1,
          productoId: 1,
          precioAnterior: 80,
          precioNuevo: 100,
          fecha: new Date('2026-03-01'),
          motivo: 'Primer aumento',
        } as HistorialPrecio,
      ];

      mockHistorialPrecioRepository.findByProductoId.mockResolvedValue(historialMock);

      const result = await service.obtenerHistorialPrecios(1);

      expect(result).toHaveLength(2);
      expect(result[0].motivo).toBe('Segundo aumento');
      expect(mockHistorialPrecioRepository.findByProductoId).toHaveBeenCalledWith(1);
    });

    it('TP-CR007-12b: debe lanzar NotFoundException si el producto no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.obtenerHistorialPrecios(999)).rejects.toThrow(
        new NotFoundException('Producto con ID 999 no encontrado.'),
      );
      expect(mockHistorialPrecioRepository.findByProductoId).not.toHaveBeenCalled();
    });

    it.todo(
      'TP-CR007-13: Actualización masiva de precios crea registros de historial para todos los productos afectados (Pendiente de coordinación/merge con rama CR-006: requiere motivo obligatorio)',
    );
  });
});
