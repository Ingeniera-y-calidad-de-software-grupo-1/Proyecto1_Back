import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Linea } from '../../../linea/domain/entities/linea.entity';
import { Marca } from '../../../marca/domain/entities/marca.entity';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import { ApiProperty } from '@nestjs/swagger';
import { ProductoOperacion } from '../../../producto-operacion/entities/producto-operacion.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { MonetarioColumn } from 'src/modules/common/decorators/monetario-column.decorator';
import { CantidadColumn } from 'src/modules/common/decorators/cantidad-column.decorator';
import { PorcentajeColumn } from 'src/modules/common/decorators/porcentaje-column.decorator';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { Margen, Precio } from '../value-objects';

@Entity('producto')
export class Producto {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'text' })
  denominacion: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  codigoProveedor?: string | null;

  @Column({ type: 'text', nullable: true })
  codigoBarra?: string | null;

  // ========== PROVEEDOR ==========
  @ManyToOne(() => Proveedor, (pro) => pro.proveedoresOperacion, {
    eager: true,
  })
  @JoinColumn({ name: 'proveedor_id' })
  @Index()
  proveedor: Proveedor;

  @Column({ type: 'int', nullable: true })
  proveedorId?: number;

  /*
  Nota: No usar el enum alciculta iva en @Column
        sino no anda el importar precios 
  */
  @PorcentajeColumn(21.0)
  alicuotaIva: AlicuotaIva;

  // Stock: cantidades reales, admite fracciones (1.5 kg, 0.25 lts)
  @CantidadColumn()
  stock: number;

  @Column('boolean', { default: false })
  utilizaStockMinimo: boolean;

  @Column('boolean', { default: false })
  utilizaStockMinimoPorEmpresa: boolean;

  @CantidadColumn()
  stockMinimo: number;

  @MonetarioColumn()
  costo?: number;

  @MonetarioColumn()
  costoDolar?: number;

  /*
  Ultima cotizacion dolar por el cambio de precio si producto posee costo dolar
  */
  @MonetarioColumn()
  cotizacionDolar?: number;
  //se utiliza en las importaciones;

  @MonetarioColumn()
  precioDolar?: number;
  // Precio de venta

  @MonetarioColumn()
  precio?: number;

  @PorcentajeColumn()
  porcentaje?: number;

  @Column({ type: 'timestamp', nullable: true })
  fechaCosto?: Date;

  @Column('boolean', { default: false })
  costoEnDolar?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fechaCostoDolar?: Date;


  @Column('boolean', { default: false })
  destacado?: boolean;

  @Column('boolean', { default: false })
  envioGratis?: boolean;

  @Column({ type: 'text', nullable: true })
  observacion?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  deletedAt?: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_created_id' })
  usuarioCreated: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_updated_id' })
  usuarioUpdated: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_deleted_id' })
  usuarioDeleted: Usuario;


  // ========== LINEA ==========
  @ManyToOne(() => Linea, (linea) => linea.productos)
  @JoinColumn({ name: 'linea_id' })
  linea: Linea;

  @Column({ type: 'int', nullable: true })
  lineaId?: number;


 // ==========  MARCA ==========
  @ManyToOne(() => Marca, (marca) => marca.productos)
  @JoinColumn({ name: 'marca_id' })
  marca: Marca;

  @Column({ type: 'int', nullable: true })
  marcaId?: number;


  @Column({ default: false })
  utilizaPack: boolean;

  @Column({ type: 'int', nullable: true })
  cantidadPorPack: number | null;

  @Column({ type: 'text', nullable: true })
  imagen?: string;


  @Column({ type: 'text', nullable: true })
  ubicacion?: string;

  @ManyToOne(() => Producto, (producto) => producto.productosOperacion)
  productosOperacion: ProductoOperacion;


  @Column({ type: 'int', default: 0 })
  sistema: number;

  @Column({ type: 'text', nullable: true })
  codigoReferencia?: string | null;

  /**
   * Calcula el precio del producto a partir del costo actual y del margen comercial.
   * Utiliza la regla del dominio: Precio = Costo * (1 + Margen / 100).
   * Adapta el valor persistido `porcentaje` al Value Object `Margen`.
   * Actualiza el atributo `precio` de la entidad y retorna el Value Object `Precio`.
   */
  calcularPrecio(): Precio {
    if (this.costo === undefined || this.costo === null) {
      throw new Error('No se puede calcular el precio sin un costo definido');
    }

    if (typeof this.costo !== 'number' || isNaN(this.costo) || !isFinite(this.costo)) {
      throw new Error('El costo debe ser un número válido');
    }

    if (this.costo < 0) {
      throw new Error('El costo no puede ser negativo');
    }

    const margen = new Margen(this.porcentaje);
    const precioCalculado = this.costo * (1 + margen.valor / 100);
    const precioVO = new Precio(precioCalculado);

    this.precio = precioVO.valor;
    return precioVO;
  }
    aplicarAjustePrecioPorPorcentaje(porcentajeAjuste: number): Precio {
    if (
      typeof porcentajeAjuste !== 'number' ||
      isNaN(porcentajeAjuste) ||
      !isFinite(porcentajeAjuste)
    ) {
      throw new Error('El porcentaje de ajuste debe ser un número válido');
    }

    const precioActual = this.obtenerPrecioActualParaAjuste();

    const nuevoPrecio =
      precioActual * (1 + porcentajeAjuste / 100);

    return this.aplicarNuevoPrecio(nuevoPrecio);
  }

  aplicarAjustePrecioPorMonto(monto: number): Precio {
    if (
      typeof monto !== 'number' ||
      isNaN(monto) ||
      !isFinite(monto)
    ) {
      throw new Error('El monto de ajuste debe ser un número válido');
    }

    const precioActual = this.obtenerPrecioActualParaAjuste();

    const nuevoPrecio = precioActual + monto;

    return this.aplicarNuevoPrecio(nuevoPrecio);
  }

  private obtenerPrecioActualParaAjuste(): number {
    if (
      this.precio === undefined ||
      this.precio === null ||
      typeof this.precio !== 'number' ||
      !isFinite(this.precio)
    ) {
      throw new Error(
        'El producto no posee un precio válido para realizar el ajuste',
      );
    }

    return this.precio;
  }

  private aplicarNuevoPrecio(nuevoPrecio: number): Precio {
    if (
      this.costo === undefined ||
      this.costo === null ||
      typeof this.costo !== 'number' ||
      !isFinite(this.costo)
    ) {
      throw new Error(
        'El producto no posee un costo válido para recalcular el margen',
      );
    }

    if (this.costo <= 0) {
      throw new Error(
        'No se puede actualizar masivamente el precio de un producto con costo menor o igual a cero',
      );
    }

    if (!isFinite(nuevoPrecio) || nuevoPrecio <= 0) {
      throw new Error(
        'El precio resultante de la actualización debe ser mayor a cero',
      );
    }

    const nuevoMargen =
      ((nuevoPrecio / this.costo) - 1) * 100;

    if (nuevoMargen < 0) {
      throw new Error(
        'El ajuste solicitado produciría un precio inferior al costo del producto',
      );
    }

    const margen = new Margen(nuevoMargen);
    const precio = new Precio(nuevoPrecio);

    this.porcentaje = margen.valor;
    this.precio = precio.valor;

    return precio;
  }
}
