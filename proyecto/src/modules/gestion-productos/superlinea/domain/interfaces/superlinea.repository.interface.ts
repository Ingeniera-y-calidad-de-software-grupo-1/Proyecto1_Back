import { SuperLinea } from '../entities/superlinea.entity';

export interface ISuperLineaRepository {
  create(superLinea: SuperLinea): Promise<SuperLinea>;

  findById(id: number): Promise<SuperLinea | null>;

  findByDenominacion(denominacion: string): Promise<SuperLinea | null>;

  findAll(): Promise<SuperLinea[]>;

  update(id: number, superLinea: Partial<SuperLinea>): Promise<SuperLinea>;

  softDelete(id: number, usuarioDeletedId: number): Promise<void>;

  hasActiveLineas(id: number): Promise<boolean>;
}

export const SUPER_LINEA_REPOSITORY = Symbol('SUPER_LINEA_REPOSITORY');