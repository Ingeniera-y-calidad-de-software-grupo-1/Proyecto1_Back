import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';

export class ActualizacionMasivaPrecioDto {
  @ApiProperty({
    enum: ['porcentaje', 'monto'],
    example: 'porcentaje',
    description: 'Forma en que se modificará el precio actual',
  })
  @IsIn(['porcentaje', 'monto'])
  tipo: 'porcentaje' | 'monto';

  @ApiProperty({
    example: 10,
    description:
      'Valor del ajuste. Puede ser positivo para aumentar o negativo para disminuir.',
  })
  @IsNumber()
  valor: number;

  @ApiProperty({
    enum: ['global', 'linea'],
    example: 'linea',
    description: 'Alcance de la actualización masiva',
  })
  @IsIn(['global', 'linea'])
  alcance: 'global' | 'linea';

  @ApiPropertyOptional({
    example: 3,
    description: 'ID de Línea. Obligatorio cuando el alcance es linea.',
  })
  @ValidateIf((dto: ActualizacionMasivaPrecioDto) => dto.alcance === 'linea')
  @IsInt()
  @Min(1)
  lineaId?: number;

  @ApiProperty({
    example: 3,
    description: 'Usuario que realiza la actualización',
  })
  @IsInt()
  @Min(1)
  usuarioId: number;
}