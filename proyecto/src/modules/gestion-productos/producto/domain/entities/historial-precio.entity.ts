import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Producto } from './producto.entity';

/**
 * Entidad de dominio append-only: HistorialPrecio (CR-007)
 * Registra hechos históricos inmutables de modificaciones efectivas de precio.
 * No admite actualizaciones ni eliminaciones.
 */
@Entity('historial_precio')
@Index('IDX_historial_precio_producto_fecha', ['productoId', 'fecha'])
export class HistorialPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'producto_id', type: 'int', nullable: false })
  productoId: number;

  @ManyToOne(() => Producto, (producto) => producto.historialPrecios, {
    onDelete: 'NO ACTION',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column('decimal', {
    name: 'precio_anterior',
    precision: 15,
    scale: 5,
    transformer: {
      to: (value: number | string): string => value?.toString(),
      from: (value: string): number => Number(value),
    },
  })
  precioAnterior: number;

  @Column('decimal', {
    name: 'precio_nuevo',
    precision: 15,
    scale: 5,
    transformer: {
      to: (value: number | string): string => value?.toString(),
      from: (value: string): number => Number(value),
    },
  })
  precioNuevo: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;

  @Column({ name: 'motivo', type: 'varchar', length: 255, nullable: false })
  motivo: string;

  /**
   * Fábrica estática con validación pura de invariantes del dominio (CR-007)
   */
  static crear(params: {
    productoId: number;
    precioAnterior: number;
    precioNuevo: number;
    motivo: string;
  }): HistorialPrecio {
    const { productoId, precioAnterior, precioNuevo, motivo } = params;

    if (!productoId || typeof productoId !== 'number' || isNaN(productoId) || productoId <= 0) {
      throw new Error('El productoId debe ser un identificador válido mayor a cero');
    }

    if (
      typeof precioAnterior !== 'number' ||
      isNaN(precioAnterior) ||
      !isFinite(precioAnterior) ||
      precioAnterior < 0
    ) {
      throw new Error('El precio anterior debe ser un número válido no negativo');
    }

    if (
      typeof precioNuevo !== 'number' ||
      isNaN(precioNuevo) ||
      !isFinite(precioNuevo) ||
      precioNuevo <= 0
    ) {
      throw new Error('El nuevo precio debe ser estrictamente mayor a cero');
    }

    if (motivo === null || motivo === undefined || typeof motivo !== 'string') {
      throw new Error('El motivo debe ser una cadena de texto');
    }

    const motivoSaneado = motivo.trim();

    if (motivoSaneado.length === 0) {
      throw new Error('El motivo no puede estar vacío');
    }

    if (motivoSaneado.length > 255) {
      throw new Error('El motivo no puede superar los 255 caracteres');
    }

    const historial = new HistorialPrecio();
    historial.productoId = productoId;
    historial.precioAnterior = precioAnterior;
    historial.precioNuevo = precioNuevo;
    historial.motivo = motivoSaneado;

    return historial;
  }
}
