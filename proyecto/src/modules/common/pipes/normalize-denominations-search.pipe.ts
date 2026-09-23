import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class NormalizeDenominacionSearchPipe implements PipeTransform {
  private readonly targetFields: Array<{ key: string; label: string }> = [
    { key: 'denominacion', label: 'La denominación' },
    { key: 'denominacionLinea', label: 'La denominación de línea' },
    { key: 'denominacionSuperLinea', label: 'La denominación de superlínea' },
  ];

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    for (const { key, label } of this.targetFields) {
      if (key in value && value[key] !== undefined && value[key] !== null) {
        if (typeof value[key] !== 'string') {
          throw new BadRequestException(`${label} debe ser una cadena.`);
        }

        const trimmed = value[key].trim();
        if (trimmed !== '') {
          value[key] = trimmed.toUpperCase();
        } else {
          // Si está vacía o solo espacios, la eliminamos
          delete value[key];
        }
      }
    }

    return value;
  }
}
