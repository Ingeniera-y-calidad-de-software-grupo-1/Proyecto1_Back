import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSuperLineaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  denominacion: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsNotEmpty({ message: 'El usuarioCreatedId es obligatorio.' })
  @IsInt({ message: 'El usuarioCreatedId debe ser un número entero.' })
  usuarioCreatedId: number;
}