import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateSuperLineaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  denominacion?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsInt({ message: 'El usuarioUpdatedId debe ser un número entero.' })
  usuarioUpdatedId: number;
}