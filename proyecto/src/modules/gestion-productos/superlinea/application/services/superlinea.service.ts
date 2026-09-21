import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SuperLinea } from '../../domain/entities/superlinea.entity';
import {
  ISuperLineaRepository,
  SUPER_LINEA_REPOSITORY,
} from '../../domain/interfaces/superlinea.repository.interface';
import { SuperLineaDeletionPolicy } from '../../domain/services/superlinea-deletion.policy';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';

@Injectable()
export class SuperLineaService {
  constructor(
    @Inject(SUPER_LINEA_REPOSITORY)
    private readonly superLineaRepository: ISuperLineaRepository,

    private readonly deletionPolicy: SuperLineaDeletionPolicy,
  ) {}

  async create(dto: CreateSuperLineaDto): Promise<SuperLinea> {
    const denominacion = this.normalizeDenominacion(dto.denominacion);

    const existing =
      await this.superLineaRepository.findByDenominacion(denominacion);

    if (existing) {
      throw new ConflictException(
        'Ya existe una superlínea con esa denominación.',
      );
    }

    const superLinea = new SuperLinea();
    superLinea.denominacion = denominacion;
    superLinea.observacion = dto.observacion?.trim() || undefined;
    superLinea.usuarioCreatedId = dto.usuarioCreatedId;

    return this.superLineaRepository.create(superLinea);
  }

  async findAll(): Promise<SuperLinea[]> {
    return this.superLineaRepository.findAll();
  }

  async findById(id: number): Promise<SuperLinea> {
    const superLinea = await this.superLineaRepository.findById(id);

    if (!superLinea) {
      throw new NotFoundException('SuperLínea no encontrada.');
    }

    return superLinea;
  }

  async update(
  id: number,
  dto: UpdateSuperLineaDto,
): Promise<SuperLinea> {
    const current = await this.findById(id);

    if (dto.denominacion !== undefined) {
      const denominacion = this.normalizeDenominacion(dto.denominacion);

      const existing =
        await this.superLineaRepository.findByDenominacion(denominacion);

      if (existing && existing.id !== current.id) {
        throw new ConflictException(
          'Ya existe una superlínea con esa denominación.',
        );
      }

      current.denominacion = denominacion;
    }

    if (dto.observacion !== undefined) {
      current.observacion = dto.observacion.trim() || undefined;
    }

    current.usuarioUpdatedId = dto.usuarioUpdatedId;

    return this.superLineaRepository.update(id, current);
  }

  async delete(id: number, usuarioId: number): Promise<void> {
    const superLinea = await this.findById(id);

    if (superLinea.sistema === 1) {
      throw new BadRequestException(
        'No se puede eliminar una superlínea del sistema.',
      );
    }

    await this.deletionPolicy.validate(id);

    await this.superLineaRepository.softDelete(id, usuarioId);
  }

  private normalizeDenominacion(denominacion: string): string {
    return denominacion.trim();
  }
}