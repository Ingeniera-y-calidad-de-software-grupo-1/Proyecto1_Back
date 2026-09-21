import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { Linea } from '../../../linea/domain/entities/linea.entity';

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