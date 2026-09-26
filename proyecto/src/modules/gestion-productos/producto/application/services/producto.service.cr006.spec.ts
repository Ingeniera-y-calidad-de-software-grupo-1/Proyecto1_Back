import { BadRequestException } from '@nestjs/common';
import { ProductoService } from './producto.service';

describe('ProductoService - Actualización masiva de precios (CR-006)', () => {
  let service: ProductoService;
  let mockRepository: any;
  let mockLineaService: any;
  let mockUsuarioValidator: any;

  beforeEach(() => {
    mockRepository = {
      actualizarPreciosMasivamente: jest.fn(),
    };

    mockLineaService = {
      findEntityById: jest.fn(),
    };

    mockUsuarioValidator = {
      validarUsuarioExiste: jest.fn(),
    };

    service = new ProductoService(
      mockRepository,
      mockLineaService,
      {} as any, // marcaService
      {} as any, // proveedorService
      {} as any, // usuarioService
      {} as any, // intrinsicValidationService
      {} as any, // validationService
      {} as any, // relatedEntitiesValidator
      {} as any, // uniquenessValidator
      mockUsuarioValidator,
      {} as any, // productoDeletePolicy
      {} as any, // historialPrecioRepository
    );
  });

  it('debe realizar una actualización global sin validar línea', async () => {
    const usuario = { id: 5 };

    mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue(usuario);
    mockRepository.actualizarPreciosMasivamente.mockResolvedValue(20);

    const dto = {
      tipo: 'porcentaje' as const,
      valor: 10,
      alcance: 'global' as const,
      usuarioId: 5,
    };

    const resultado = await service.actualizarPreciosMasivamente(dto);

    expect(
      mockUsuarioValidator.validarUsuarioExiste,
    ).toHaveBeenCalledWith(5);

    expect(mockLineaService.findEntityById).not.toHaveBeenCalled();

    expect(
      mockRepository.actualizarPreciosMasivamente,
    ).toHaveBeenCalledWith(dto, usuario);

    expect(resultado).toEqual({
      cantidadActualizada: 20,
    });
  });

  it('debe validar la línea antes de realizar una actualización por línea', async () => {
    const usuario = { id: 5 };
    const linea = { id: 3 };

    mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue(usuario);
    mockLineaService.findEntityById.mockResolvedValue(linea);
    mockRepository.actualizarPreciosMasivamente.mockResolvedValue(7);

    const dto = {
      tipo: 'monto' as const,
      valor: 1500,
      alcance: 'linea' as const,
      lineaId: 3,
      usuarioId: 5,
    };

    const resultado = await service.actualizarPreciosMasivamente(dto);

    expect(
      mockUsuarioValidator.validarUsuarioExiste,
    ).toHaveBeenCalledWith(5);

    expect(mockLineaService.findEntityById).toHaveBeenCalledWith(3);

    expect(
      mockRepository.actualizarPreciosMasivamente,
    ).toHaveBeenCalledWith(dto, usuario);

    expect(resultado).toEqual({
      cantidadActualizada: 7,
    });
  });

  it('debe rechazar alcance por línea cuando no se informa lineaId', async () => {
    const usuario = { id: 5 };

    mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue(usuario);

    const dto = {
      tipo: 'porcentaje' as const,
      valor: 10,
      alcance: 'linea' as const,
      usuarioId: 5,
    };

    await expect(
      service.actualizarPreciosMasivamente(dto),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.actualizarPreciosMasivamente(dto),
    ).rejects.toThrow(
      'Debe indicar una línea para realizar la actualización por línea',
    );

    expect(mockLineaService.findEntityById).not.toHaveBeenCalled();

    expect(
      mockRepository.actualizarPreciosMasivamente,
    ).not.toHaveBeenCalled();
  });

  it('no debe actualizar productos si la validación de usuario falla', async () => {
    mockUsuarioValidator.validarUsuarioExiste.mockRejectedValue(
      new Error('Usuario no encontrado'),
    );

    const dto = {
      tipo: 'porcentaje' as const,
      valor: 10,
      alcance: 'global' as const,
      usuarioId: 999,
    };

    await expect(
      service.actualizarPreciosMasivamente(dto),
    ).rejects.toThrow('Usuario no encontrado');

    expect(
      mockRepository.actualizarPreciosMasivamente,
    ).not.toHaveBeenCalled();
  });

  it('no debe actualizar productos si la línea indicada no existe', async () => {
    const usuario = { id: 5 };

    mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue(usuario);

    mockLineaService.findEntityById.mockRejectedValue(
      new Error('Línea no encontrada'),
    );

    const dto = {
      tipo: 'monto' as const,
      valor: 1000,
      alcance: 'linea' as const,
      lineaId: 999,
      usuarioId: 5,
    };

    await expect(
      service.actualizarPreciosMasivamente(dto),
    ).rejects.toThrow('Línea no encontrada');

    expect(
      mockRepository.actualizarPreciosMasivamente,
    ).not.toHaveBeenCalled();
  });
  it('debe convertir un error de negocio del repositorio en BadRequestException', async () => {
  const usuario = { id: 5 };

  mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue(usuario);

  mockRepository.actualizarPreciosMasivamente.mockRejectedValue(
    new Error(
      'El ajuste solicitado produciría un precio inferior al costo del producto',
    ),
  );

  const dto = {
    tipo: 'monto' as const,
    valor: -3000,
    alcance: 'global' as const,
    usuarioId: 5,
  };

  await expect(
    service.actualizarPreciosMasivamente(dto),
  ).rejects.toThrow(BadRequestException);

  await expect(
    service.actualizarPreciosMasivamente(dto),
  ).rejects.toThrow(
    'El ajuste solicitado produciría un precio inferior al costo del producto',
  );

  expect(
    mockRepository.actualizarPreciosMasivamente,
  ).toHaveBeenCalledWith(dto, usuario);
});
});