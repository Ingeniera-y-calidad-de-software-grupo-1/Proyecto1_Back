import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { Linea } from '../../../linea/domain/entities/linea.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { FechaUtils } from 'src/modules/common/utils/date/fecha-utils';

@Injectable()
export class SuperLineaRepository implements ISuperLineaRepository {
  constructor(
    @InjectRepository(SuperLinea)
    private readonly repository: Repository<SuperLinea>,

    @InjectRepository(Linea)
    private readonly lineaRepository: Repository<Linea>,
  ) {}

  async create(superLinea: SuperLinea): Promise<SuperLinea> {
    return this.repository.save(superLinea);
  }

  async findById(id: number): Promise<SuperLinea | null> {
    return this.repository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  async findByDenominacion(
    denominacion: string,
  ): Promise<SuperLinea | null> {
    return this.repository.findOne({
      where: {
        denominacion,
        deletedAt: IsNull(),
      },
    });
  }

  async findAll(): Promise<SuperLinea[]> {
    return this.repository.find({
      where: {
        deletedAt: IsNull(),
      },
      order: {
        denominacion: 'ASC',
      },
    });
  }

  async findByDenominacionFiltered(
  denominacion: string,
  skip = 0,
  take = 10,
  incluirEliminados = false,
): Promise<{ data: SuperLinea[]; total: number }> {
  const query = this.repository.createQueryBuilder('superlinea');

  if (incluirEliminados) {
    query.withDeleted();
  } else {
    query.andWhere('superlinea.deletedAt IS NULL');
  }

  if (denominacion) {
    query.andWhere(
      'UPPER(superlinea.denominacion) LIKE :denominacion',
      {
        denominacion: `%${denominacion.toUpperCase()}%`,
      },
    );
  }

  query
    .orderBy('superlinea.denominacion', 'ASC')
    .skip(skip)
    .take(take);

  const [data, total] = await query.getManyAndCount();

  return { data, total };
}

async findByIdConAuditoria(
  id: number,
): Promise<AuditoriaDto | null> {
  const raw = await this.repository
    .createQueryBuilder('superlinea')
    .withDeleted()
    .leftJoin(
      'usuario',
      'usuarioCreated',
      'usuarioCreated.id = superlinea.usuarioCreatedId',
    )
    .leftJoin(
      'usuario',
      'usuarioUpdated',
      'usuarioUpdated.id = superlinea.usuarioUpdatedId',
    )
    .leftJoin(
      'usuario',
      'usuarioDeleted',
      'usuarioDeleted.id = superlinea.usuarioDeletedId',
    )
    .addSelect([
      'superlinea.id as superlinea_id',
      'superlinea.denominacion as superlinea_denominacion',
      'superlinea.createdAt as superlinea_createdAt',
      'superlinea.updatedAt as superlinea_updatedAt',
      'superlinea.deletedAt as superlinea_deletedAt',
      'usuarioCreated.denominacion as usuarioCreated_nombre',
      'usuarioUpdated.denominacion as usuarioUpdated_nombre',
      'usuarioDeleted.denominacion as usuarioDeleted_nombre',
    ])
    .where('superlinea.id = :id', { id })
    .getRawOne();

  if (!raw) return null;

  return {
    id: raw.superlinea_id ?? 0,
    detalle: raw.superlinea_denominacion
      ? `superlínea ${raw.superlinea_denominacion}`
      : 'superlínea (sin denominación)',
    createdAt: raw.superlinea_createdAt
      ? FechaUtils.formatFechaHora(raw.superlinea_createdAt)
      : '',
    updatedAt: raw.superlinea_updatedAt
      ? FechaUtils.formatFechaHora(raw.superlinea_updatedAt)
      : '',
    deletedAt: raw.superlinea_deletedAt
      ? FechaUtils.formatFechaHora(raw.superlinea_deletedAt)
      : '',
    usuarioCreated: raw.usuarioCreated_nombre ?? '',
    usuarioUpdated: raw.usuarioUpdated_nombre ?? '',
    usuarioDeleted: raw.usuarioDeleted_nombre ?? '',
  };
}

  async update(
    id: number,
    superLinea: Partial<SuperLinea>,
  ): Promise<SuperLinea> {
    await this.repository.update(id, superLinea);

    const updatedSuperLinea = await this.findById(id);

    if (!updatedSuperLinea) {
      throw new Error('SuperLínea no encontrada después de actualizar.');
    }

    return updatedSuperLinea;
  }

  async softDelete(
    id: number,
    usuarioDeletedId: number,
  ): Promise<void> {
    await this.repository.update(id, {
      usuarioDeletedId,
      deletedAt: new Date(),
    });
  }

  async hasActiveLineas(id: number): Promise<boolean> {
    const count = await this.lineaRepository.count({
      where: {
        superLineaId: id,
        deletedAt: IsNull(),
      },
    });

    return count > 0;
  }
}