import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { ProveedorService } from 'src/modules/organizacion/proveedor/application/services/proveedor.service';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { AuditoriaMapper } from 'src/modules/gestion-sistema/auditoria/mappers/auditoria.mapper';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { Producto } from '../../domain/entities/producto.entity';
import { IProductoRepository, BuscarProductoCriteria } from '../../domain/interfaces/producto.repository-interface';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { GetProductoDto } from '../../dto/get-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { ProductoMapper } from '../../mappers/producto.mapper';
import { Presentacion } from '../../domain/value-objects';
import { LineaService } from 'src/modules/gestion-productos/linea/application/services/linea.service';
import { MarcaService } from 'src/modules/gestion-productos/marca/application/services/marca.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { ProductoValidationService } from '../../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator.ts';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { ActualizacionMasivaPrecioDto } from '../../dto/actualizacion-masiva-precio.dto';
@Injectable()
export class ProductoService {
  private readonly logger = new Logger(ProductoService.name);
  constructor(
    @Inject('IProductoRepository')
    private readonly repository: IProductoRepository,
    private readonly lineaService: LineaService,

    @Inject(forwardRef(() => MarcaService))
    private readonly marcaService: MarcaService,
    private readonly proveedorService: ProveedorService,
    private readonly usuarioService: UsuarioService,

    //  Domain Services
    private readonly intrinsicValidationService: ProductoIntrinsicValidationService,
    private readonly validationService: ProductoValidationService,

    // Infrastructure Validators
    private readonly relatedEntitiesValidator: ProductoRelatedEntitiesValidator,
    private readonly uniquenessValidator: ProductoUniquenessValidator,
    private readonly usuarioValidator: UsuarioValidator,

    private readonly productoDeletePolicy: ProductoDeletePolicy,

  ) { }

  private readonly ENTITY_NAME = 'Producto';

  async create(dto: CreateProductoDto) {
    this.logger.log(
      `Creando un nuevo ${this.ENTITY_NAME} con denominación: ${dto.denominacion}`,
    );

    // 1. Orquestar todas las validaciones de entrada, composición y reglas de negocio
    const {
      marca,
      linea,
      usuario,
      denominacionFinal,
      presentacionSaneada,
    } = await this.validarYPrepararCreacion(dto);

    // 2. Preparar Producto y calcular explícitamente el precio desde el dominio
    const productoParaCalcular = new Producto();
    productoParaCalcular.costo = dto.costo;
    productoParaCalcular.porcentaje = dto.porcentaje;
    const precioCalculado = productoParaCalcular.calcularPrecio();

    // 3. Construir datos finales para persistencia sin mutar directamente el DTO recibido
    const datosParaCrear: CreateProductoDto = {
      ...dto,
      denominacion: denominacionFinal,
      presentacion: presentacionSaneada,
      precio: precioCalculado.valor,
    };

    const entity = await this.repository.create(
      datosParaCrear,
      linea,
      marca,
      usuario,
    );

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateProductoDto) {
    this.logger.log(`Actualizando ${this.ENTITY_NAME} con ID: ${id}`);

    const {
      marca,
      linea,
      usuario,
      denominacionEfectiva,
      presentacionSaneada,
      precioRecalculado,
    } = await this.validarYPrepararActualizacion(id, dto);

    // Construir datos de actualización sin mutar el DTO original.
    // Si denominacion es undefined, no se incluye para preservar la persistida.
    const datosParaActualizar: UpdateProductoDto = {
      ...dto,
    };

    if (presentacionSaneada !== undefined) {
      datosParaActualizar.presentacion = presentacionSaneada;
    }

    if (dto.denominacion !== undefined) {
      datosParaActualizar.denominacion = denominacionEfectiva;
    }

    if (precioRecalculado !== undefined) {
      datosParaActualizar.precio = precioRecalculado;
    }

    const entity = await this.repository.update(
      id,
      datosParaActualizar,
      linea,
      marca,
      usuario,
    );

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'editada',
    );
  }

    async actualizarPreciosMasivamente(
    dto: ActualizacionMasivaPrecioDto,
  ): Promise<{ cantidadActualizada: number }> {
    this.logger.log(
      `Actualizando precios masivamente. Tipo: ${dto.tipo}, alcance: ${dto.alcance}`,
    );

    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioId,
    );

    if (dto.alcance === 'linea') {
      if (!dto.lineaId) {
        throw new BadRequestException(
          'Debe indicar una línea para realizar la actualización por línea',
        );
      }

      await this.lineaService.findEntityById(dto.lineaId);
    }

    try {
  const cantidadActualizada =
    await this.repository.actualizarPreciosMasivamente(
      dto,
      usuario,
    );

  return {
    cantidadActualizada,
  };
} catch (error) {
  if (error instanceof Error) {
    throw new BadRequestException(error.message);
  }

  throw error;
}
  }

  async findByRapido(
    codigo: string,
    exacto: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.warn(`service`);
    const result = await this.repository.findByRapido(
      codigo,
      exacto,
      skip,
      take,
    );
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }


  async findBy(
    criteria: BuscarProductoCriteria,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    const result = await this.repository.findBy(criteria);
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }


  async buscarMarcaDesdeProducto(id: number) {
    return this.marcaService.findEntityById(id);
  }

  async buscarLineaDesdeProducto(id: number) {
    return this.lineaService.findEntityById(id);
  }

  async findByIdConAuditoria(id: number) {
    const entity = await this.repository.findByIdConAuditoria(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return AuditoriaMapper.mapProductoToDto(entity);
  }

  async findDtoById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    this.logger.log(`b1x`);
    return ProductoMapper.toDto(entity);
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return entity;
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.findEntityById(id);

    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    

    ensureNotSistemaEntity(entity, 'Producto');

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    await this.repository.remove(entity, usuario);
    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'eliminada',
    );
  }


  async findAllForLineas(denominacion: string) {
    return this.lineaService.findAllFor(denominacion);
  }

  async findAllForMarcas(denominacion: string) {
    return this.marcaService.findAllFor(denominacion);
  }

  async findByDenominacionCodigoProveedorFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.log(
      `  Buscando en srvice producto o ${denominacion}  skip=${skip}, take=${take}`,
    );
    const result =
      await this.repository.findByDenominacionCodigoProveedorFiltered(
        denominacion,
        skip,
        take,
      );
    this.logger.log(result);
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async existsProductosActivosByMarca(marcaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByMarca(marcaId);
  }
  async existsProductosActivosByLinea(lineaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByLinea(lineaId);
  }


  async findByIds(ids: number[]): Promise<Producto[]> {
    return this.repository.findByIds(ids);
  }

  async incrementarStock(
    uow: IUnitOfWork,
    productoId: number,
    cantidad: number,
    origen?: string,
  ): Promise<number> {
    return this.ajustarStockInterno(uow, productoId, cantidad, origen);
  }

  async decrementarStock(
    uow: IUnitOfWork,
    productoId: number,
    cantidad: number,
    origen?: string,
  ): Promise<number> {
    return this.ajustarStockInterno(uow, productoId, -cantidad, origen);
  }

  private async ajustarStockInterno(
    uow: IUnitOfWork,
    productoId: number,
    delta: number,
    origen?: string,
  ): Promise<number> {
    const producto = await this.repository.findOne(productoId);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${productoId} no encontrado`);
    }

    const stockActual = producto.stock ?? 0;
    const nuevoStock = stockActual + delta;

    if (nuevoStock < 0) {
      throw new BadRequestException(
        `El stock resultante (${nuevoStock}) no puede ser negativo. Stock actual: ${stockActual}, ajuste solicitado: ${delta}.`,
      );
    }

    producto.stock = nuevoStock;
    await this.repository.updateEntity(uow, producto);

    this.logger.log(
      `[StockService] ${origen ?? 'Desconocido'} → ${stockActual} → ${nuevoStock}`,
    );

    return nuevoStock;
  }

  /**
   * Orquesta todas las validaciones necesarias para crear un producto
   * @private
   */
  private async validarYPrepararCreacion(dto: CreateProductoDto) {
    // 1. Validar invariantes de Presentacion mediante el Value Object del dominio (CR-002)
    let presentacionSaneada: string;
    try {
      const presentacionVO = new Presentacion(dto.presentacion);
      presentacionSaneada = presentacionVO.valor;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    // 2. Validar que entidades relacionadas existen (Infrastructure - DB en paralelo)
    const { marca, linea } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId,
        dto.lineaId,
      );

    // 3. Validar reglas de negocio sobre entidades (Domain)
    this.validationService.validarEntidadesRelacionadas(
      marca,
      linea,
    );

    // 4. Validar usuario existe (Infrastructure)
    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioCreatedId,
    );

    // 5. Preparar instancia de Producto y determinar la denominación final
    const producto = new Producto();
    producto.presentacion = presentacionSaneada;

    let denominacionFinal: string;
    const esDenominacionVacia =
      dto.denominacion === undefined ||
      dto.denominacion === null ||
      (typeof dto.denominacion === 'string' && dto.denominacion.trim() === '');

    try {
      if (esDenominacionVacia) {
        denominacionFinal = producto.componerDenominacion(
          marca.denominacion,
          linea.denominacion,
        );
      } else {
        denominacionFinal = producto.actualizarDenominacion(
          dto.denominacion as string,
        );
      }
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    // 6. Validar datos intrínsecos sobre la denominación final (Domain)
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: denominacionFinal,
      marcaId: dto.marcaId,
      lineaId: dto.lineaId,
      costo: dto.costo,
      porcentaje: dto.porcentaje,
      stock: dto.stock,
      utilizaStockMinimo: dto.utilizaStockMinimo,
      stockMinimo: dto.stockMinimo,
      alicuotaIva: dto.alicuotaIva,
    });

    // 7. Validar unicidad sobre la denominación FINAL (Infrastructure - DB)
    await this.uniquenessValidator.validarDenominacionUnica(denominacionFinal);

    if (dto.codigoProveedor) {
      await this.uniquenessValidator.validarCodigoProveedorUnico(
        dto.codigoProveedor,
        0,
      );
    }

    return {
      marca,
      linea,
      usuario,
      denominacionFinal,
      presentacionSaneada,
    };
  }

  /**
   * Orquesta todas las validaciones necesarias para actualizar un producto
   * @private
   */
  private async validarYPrepararActualizacion(
    id: number,
    dto: UpdateProductoDto,
  ) {
    // Si se envía presentación, validar invariantes mediante el Value Object del dominio
    let presentacionSaneada: string | undefined;
    if (dto.presentacion !== undefined) {
      try {
        const presentacionVO = new Presentacion(dto.presentacion);
        presentacionSaneada = presentacionVO.valor;
      } catch (error: any) {
        throw new BadRequestException(error.message);
      }
    }

    // Obtener producto actual
    const productoActual = await this.repository.findOne(id);
    if (!productoActual)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );

    if (
      productoActual.lineaId == null ||
      productoActual.marcaId == null
    ) {
      throw new InternalServerErrorException('Producto en estado inválido');
    }

    // En UPDATE: si denominacion viene definida, validarla con el modelo.
    // Si viene undefined, conservar productoActual.denominacion sin autocomponer.
    let denominacionEfectiva = productoActual.denominacion;
    if (dto.denominacion !== undefined) {
      try {
        denominacionEfectiva = productoActual.actualizarDenominacion(dto.denominacion);
      } catch (error: any) {
        throw new BadRequestException(error.message);
      }
    }

    const costoEfectivo = dto.costo !== undefined ? dto.costo : productoActual.costo;
    const porcentajeEfectivo = dto.porcentaje !== undefined ? dto.porcentaje : productoActual.porcentaje;
    const stockEfectivo = dto.stock !== undefined ? dto.stock : productoActual.stock;
    const utilizaStockMinimoEfectivo =
      dto.utilizaStockMinimo !== undefined ? dto.utilizaStockMinimo : productoActual.utilizaStockMinimo;
    const stockMinimoEfectivo =
      dto.stockMinimo !== undefined ? dto.stockMinimo : productoActual.stockMinimo;

    // Validar datos intrínsecos combinados con la denominación efectiva
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: denominacionEfectiva,
      marcaId: dto.marcaId ?? productoActual.marcaId,
      lineaId: dto.lineaId ?? productoActual.lineaId,
      costo: costoEfectivo,
      porcentaje: porcentajeEfectivo,
      stock: stockEfectivo,
      utilizaStockMinimo: utilizaStockMinimoEfectivo,
      stockMinimo: stockMinimoEfectivo,
      alicuotaIva: dto.alicuotaIva ?? productoActual.alicuotaIva,
    });

    // Recalcular explícitamente el precio con el dominio si hay costo definido
    let precioRecalculado: number | undefined;
    if (costoEfectivo !== undefined && costoEfectivo !== null) {
      const productoParaCalcular = new Producto();
      productoParaCalcular.costo = costoEfectivo;
      productoParaCalcular.porcentaje = porcentajeEfectivo;
      const precioVO = productoParaCalcular.calcularPrecio();
      precioRecalculado = precioVO.valor;
    }

    // Validar unicidad (excluyendo el ID actual) solo si se envía y modifica la denominación
    if (dto.denominacion !== undefined && denominacionEfectiva !== productoActual.denominacion) {
      await this.uniquenessValidator.validarDenominacionUnica(
        denominacionEfectiva,
        id,
      );
    }

    // Validar entidades relacionadas
    const { marca, linea } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId ?? productoActual.marcaId,
        dto.lineaId ?? productoActual.lineaId,
      );

    // Validar reglas de negocio
    this.validationService.validarEntidadesRelacionadas(
      marca,
      linea,
    );

    // Validar usuario
    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioUpdatedId,
    );

    return {
      marca,
      linea,
      usuario,
      denominacionEfectiva,
      presentacionSaneada,
      precioRecalculado,
    };
  }
}
