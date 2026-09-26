import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { IHistorialPrecioRepository } from '../../domain/interfaces/historial-precio.repository-interface';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';

@Injectable()
export class HistorialPrecioRepository implements IHistorialPrecioRepository {
  private readonly logger = new Logger(HistorialPrecioRepository.name);

  constructor(
    @InjectRepository(HistorialPrecio)
    private readonly repository: Repository<HistorialPrecio>,
  ) {}

  async guardar(
    historial: HistorialPrecio | HistorialPrecio[],
    uow?: IUnitOfWork,
  ): Promise<HistorialPrecio | HistorialPrecio[]> {
    try {
      const repo = uow ? uow.getRepository(HistorialPrecio) : this.repository;
      return await repo.save(historial as any);
    } catch (error) {
      this.logger.error('Error al persistir HistorialPrecio:', error);
      throw new DatabaseConnectionException(
        'Error al guardar en la base de datos el historial de precio.',
      );
    }
  }

  async findByProductoId(productoId: number): Promise<HistorialPrecio[]> {
    try {
      return await this.repository
        .createQueryBuilder('historial')
        .where('historial.producto_id = :productoId', { productoId })
        .orderBy('historial.fecha', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Error al buscar historial del producto ${productoId}:`,
        error,
      );
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }
}
