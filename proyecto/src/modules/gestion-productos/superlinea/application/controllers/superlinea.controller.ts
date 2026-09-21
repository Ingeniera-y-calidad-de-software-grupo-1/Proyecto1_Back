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