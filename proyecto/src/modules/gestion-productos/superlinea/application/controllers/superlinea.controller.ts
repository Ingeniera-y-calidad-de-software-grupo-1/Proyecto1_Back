import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';

import { SuperLineaService } from '../services/superlinea.service';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { UsePipes } from '@nestjs/common';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Gestion Productos')
@Controller('superlinea')
@UseGuards(AuthGuard)
export class SuperLineaController {
  constructor(
    private readonly superLineaService: SuperLineaService,
  ) {}

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  create(@Body() dto: CreateSuperLineaDto) {
    return this.superLineaService.create(dto);
  }

  @Get()
  @Roles('Root', 'Administrador', 'Empleado')
  findAll() {
    return this.superLineaService.findAll();
  }

  @Get('search-by')
@Roles('Root', 'Administrador', 'Empleado')
@UsePipes(NormalizeDenominacionSearchPipe)
findByDenominacionFiltered(
  @Query() paginationDto: PaginationWithDenominacionDto,
) {
  const {
    denominacion = '',
    skip,
    take,
    incluirEliminados,
  } = paginationDto;

  return this.superLineaService.findByDenominacionFiltered(
    denominacion,
    skip,
    take,
    incluirEliminados,
  );
}
@Get(':id/audit')
@Roles('Root', 'Administrador', 'Empleado')
@ApiOkResponse({
  description: 'Información de auditoría',
  type: AuditoriaDto,
})
findByIdConAuditoria(
  @Param('id', ParseIntPipe) id: number,
): Promise<AuditoriaDto> {
  return this.superLineaService.findByIdConAuditoria(id);
}

  @Get(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.superLineaService.findById(id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSuperLineaDto,
  ) {
    return this.superLineaService.update(id, dto);
  }

  @Delete(':id')
@Roles('Root', 'Administrador', 'Empleado')
remove(
  @Param('id', ParseIntPipe) id: number,
  @Query('usuarioId', ParseIntPipe) usuarioId: number,
) {
  return this.superLineaService.delete(id, usuarioId);
}
}