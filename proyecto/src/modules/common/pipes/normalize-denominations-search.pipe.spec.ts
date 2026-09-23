
import { BadRequestException } from '@nestjs/common';
import { NormalizeDenominacionSearchPipe } from './normalize-denominations-search.pipe';

describe('NormalizeDenominacionSearchPipe', () => {
  let pipe: NormalizeDenominacionSearchPipe;

  beforeEach(() => {
    pipe = new NormalizeDenominacionSearchPipe();
  });

  describe('denominacion (Producto)', () => {
    it('debería convertir a mayúsculas y eliminar espacios', () => {
      const input = { denominacion: '  prueba nombre  ' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result.denominacion).toBe('PRUEBA NOMBRE');
    });

    it('debería eliminar la propiedad si es string vacío', () => {
      const input = { denominacion: '' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).not.toHaveProperty('denominacion');
    });

    it('debería eliminar la propiedad si son solo espacios', () => {
      const input = { denominacion: '     ' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).not.toHaveProperty('denominacion');
    });

    it('debería lanzar BadRequestException si denominacion no es string', () => {
      const input = { denominacion: 123 };
      expect(() => pipe.transform(input, { type: 'query' } as any)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('denominacionLinea (CR-004)', () => {
    it('debería convertir a mayúsculas y eliminar espacios en denominacionLinea', () => {
      const input = { denominacionLinea: '  ferreteria pesada  ' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result.denominacionLinea).toBe('FERRETERIA PESADA');
    });

    it('debería eliminar denominacionLinea si es string vacío', () => {
      const input = { denominacionLinea: '' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).not.toHaveProperty('denominacionLinea');
    });

    it('debería eliminar denominacionLinea si son solo espacios', () => {
      const input = { denominacionLinea: '   ' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).not.toHaveProperty('denominacionLinea');
    });

    it('debería lanzar BadRequestException si denominacionLinea no es string', () => {
      const input = { denominacionLinea: 456 };
      expect(() => pipe.transform(input, { type: 'query' } as any)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('denominacionSuperLinea (CR-004)', () => {
    it('debería convertir a mayúsculas y eliminar espacios en denominacionSuperLinea', () => {
      const input = { denominacionSuperLinea: '  construccion  ' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result.denominacionSuperLinea).toBe('CONSTRUCCION');
    });

    it('debería eliminar denominacionSuperLinea si es string vacío', () => {
      const input = { denominacionSuperLinea: '' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).not.toHaveProperty('denominacionSuperLinea');
    });

    it('debería eliminar denominacionSuperLinea si son solo espacios', () => {
      const input = { denominacionSuperLinea: '      ' };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).not.toHaveProperty('denominacionSuperLinea');
    });

    it('debería lanzar BadRequestException si denominacionSuperLinea no es string', () => {
      const input = { denominacionSuperLinea: true };
      expect(() => pipe.transform(input, { type: 'query' } as any)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('Combinación y preservación de otros campos', () => {
    it('debería normalizar múltiples criterios simultáneamente', () => {
      const input = {
        denominacion: '  tornillo  ',
        denominacionLinea: '  buloneria  ',
        denominacionSuperLinea: '  fijaciones  ',
        codigoProveedor: 'PROV-01',
        lineaId: 5,
        skip: 0,
        take: 10,
      };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).toEqual({
        denominacion: 'TORNILLO',
        denominacionLinea: 'BULONERIA',
        denominacionSuperLinea: 'FIJACIONES',
        codigoProveedor: 'PROV-01',
        lineaId: 5,
        skip: 0,
        take: 10,
      });
    });

    it('debería mantener el objeto si no tiene ninguno de los tres campos', () => {
      const input = { otroCampo: 'algo', lineaId: 2 };
      const result = pipe.transform(input, { type: 'query' } as any);
      expect(result).toEqual({ otroCampo: 'algo', lineaId: 2 });
    });
  });
});
