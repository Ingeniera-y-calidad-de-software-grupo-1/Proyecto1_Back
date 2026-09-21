import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  ISuperLineaRepository,
  SUPER_LINEA_REPOSITORY,
} from '../interfaces/superlinea.repository.interface';

@Injectable()
export class SuperLineaDeletionPolicy {
  constructor(
    @Inject(SUPER_LINEA_REPOSITORY)
    private readonly superLineaRepository: ISuperLineaRepository,
  ) {}

  async validate(superLineaId: number): Promise<void> {
    const hasActiveLineas =
      await this.superLineaRepository.hasActiveLineas(superLineaId);

    if (hasActiveLineas) {
      throw new BadRequestException(
        'No se puede eliminar la superlínea porque tiene líneas activas asociadas.',
      );
    }
  }
}