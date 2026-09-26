import { ProductoService } from './producto.service';
import { BuscarProductoCriteria } from '../../domain/interfaces/producto.repository-interface';
import { Producto } from '../../domain/entities/producto.entity';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';

describe('ProductoService - findBy (CR-004)', () => {
  let service: ProductoService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findBy: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    service = new ProductoService(
      mockRepository,
      {} as any, // lineaService
      {} as any, // marcaService
      {} as any, // proveedorService
      {} as any, // usuarioService
      {} as any, // intrinsicValidationService
      {} as any, // validationService
      {} as any, // relatedEntitiesValidator
      {} as any, // uniquenessValidator
      {} as any, // usuarioValidator
      {} as any, // productoDeletePolicy
      {} as any, // historialPrecioRepository
    );
  });

  it('debe recibir el objeto de criterios y delegarlo exactamente al repository', async () => {
    const criteria: BuscarProductoCriteria = {
      denominacion: 'TORNILLO',
      denominacionLinea: 'FERRETERIA',
      denominacionSuperLinea: 'CONSTRUCCION',
      codigoProveedor: 'PROV-123',
      codProveedorExacto: true,
      codigoReferencia: 'REF-456',
      codReferenciaExacto: false,
      marcaId: 1,
      lineaId: 2,
      proveedorId: 3,
      conStock: true,
      skip: 10,
      take: 20,
    };

    const mockProducto = new Producto();
    mockProducto.id = 1;
    mockProducto.denominacion = 'Tornillo de Acero';
    mockProducto.stock = 50;
    mockProducto.precio = 100;
    mockProducto.codigoProveedor = 'PROV-123';
    mockProducto.codigoReferencia = 'REF-456';
    mockProducto.observacion = 'Ninguna';

    const mockSuperLinea = new SuperLinea();
    mockSuperLinea.id = 10;
    mockSuperLinea.denominacion = 'Construcción';

    const mockLinea = new Linea();
    mockLinea.id = 2;
    mockLinea.denominacion = 'Ferretería';
    mockLinea.superLinea = mockSuperLinea;
    mockProducto.linea = mockLinea;

    mockRepository.findBy.mockResolvedValue({
      data: [mockProducto],
      total: 1,
    });

    const result = await service.findBy(criteria);

    expect(mockRepository.findBy).toHaveBeenCalledTimes(1);
    expect(mockRepository.findBy).toHaveBeenCalledWith(criteria);
    expect(result.total).toBe(1);
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe(1);
    expect(result.data[0].denominacion).toBe('Tornillo de Acero');
  });

  it('debe manejar resultados vacíos delegando fielmente al repository', async () => {
    const criteria: BuscarProductoCriteria = {
      denominacion: 'INEXISTENTE',
      skip: 0,
      take: 10,
    };

    mockRepository.findBy.mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await service.findBy(criteria);

    expect(mockRepository.findBy).toHaveBeenCalledWith(criteria);
    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });
});
