import { HistorialPrecio } from '../entities/historial-precio.entity';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';

export interface IHistorialPrecioRepository {
  guardar(
    historial: HistorialPrecio | HistorialPrecio[],
    uow?: IUnitOfWork,
  ): Promise<HistorialPrecio | HistorialPrecio[]>;

  findByProductoId(productoId: number): Promise<HistorialPrecio[]>;
}
