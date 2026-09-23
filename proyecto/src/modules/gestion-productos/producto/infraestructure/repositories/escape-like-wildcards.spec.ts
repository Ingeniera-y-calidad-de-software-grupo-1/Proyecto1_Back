import { escapeLikeWildcards } from './producto.persistence-adapters';

describe('escapeLikeWildcards - CR-004 (RN-CR004-11)', () => {
  it('debe devolver string vacío si se pasa string vacío', () => {
    expect(escapeLikeWildcards('')).toBe('');
  });

  it('no debe alterar texto que no contenga comodines ni carácter de escape', () => {
    expect(escapeLikeWildcards('Tornillo Hexagonal 1/2')).toBe('Tornillo Hexagonal 1/2');
  });

  it('debe escapar el carácter comodín % con !%', () => {
    expect(escapeLikeWildcards('10%')).toBe('10!%');
    expect(escapeLikeWildcards('100% puro')).toBe('100!% puro');
  });

  it('debe escapar el carácter comodín _ con !_', () => {
    expect(escapeLikeWildcards('tornillo_1')).toBe('tornillo!_1');
    expect(escapeLikeWildcards('_prod_')).toBe('!_prod!_');
  });

  it('debe escapar el carácter de escape ! con !!', () => {
    expect(escapeLikeWildcards('oferta!')).toBe('oferta!!');
    expect(escapeLikeWildcards('¡super!')).toBe('¡super!!');
  });

  it('debe escapar combinaciones complejas preservando el orden de escape', () => {
    // Si la entrada es "¡100% de descuento_para todos!",
    // ! -> !!
    // % -> !%
    // _ -> !_
    expect(escapeLikeWildcards('100%_descuento!')).toBe('100!%!_descuento!!');
  });
});
