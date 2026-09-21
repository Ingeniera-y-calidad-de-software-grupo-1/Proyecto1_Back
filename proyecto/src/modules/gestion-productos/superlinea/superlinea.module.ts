import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SuperLinea } from './domain/entities/superlinea.entity';
import { Linea } from '../linea/domain/entities/linea.entity';

import { SuperLineaController } from './application/controllers/superlinea.controller';
import { SuperLineaService } from './application/services/superlinea.service';

import { SuperLineaRepository } from './infraestructure/repositories/superlinea.repository';
import { SuperLineaDeletionPolicy } from './domain/services/superlinea-deletion.policy';

import { SUPER_LINEA_REPOSITORY } from './domain/interfaces/superlinea.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SuperLinea,
      Linea,
    ]),
  ],
  controllers: [
    SuperLineaController,
  ],
  providers: [
    SuperLineaService,
    SuperLineaDeletionPolicy,
    {
      provide: SUPER_LINEA_REPOSITORY,
      useClass: SuperLineaRepository,
    },
  ],
  exports: [
    SuperLineaService,
    SUPER_LINEA_REPOSITORY,
  ],
})
export class SuperLineaModule {}