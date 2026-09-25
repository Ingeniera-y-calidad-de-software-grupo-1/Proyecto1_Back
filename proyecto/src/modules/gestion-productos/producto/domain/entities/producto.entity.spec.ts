import { Producto } from './producto.entity';
import { Precio } from '../value-objects';

describe('Producto Aggregate Root - calcularPrecio()', () => {
  let producto: Producto;

  beforeEach(() => {
    producto = new Producto();
  });

  it('debe calcular el precio con costo 1000 y margen 15 dando 1150', () => {
    producto.costo = 1000;
    producto.porcentaje = 15;

    const precio = producto.calcularPrecio();

    expect(precio).toBeInstanceOf(Precio);
    expect(precio.valor).toBe(1150);
    expect(producto.precio).toBe(1150);
  });

  it('debe calcular el precio con otro margen (costo 1000 y margen 25 dando 1250)', () => {
    producto.costo = 1000;
    producto.porcentaje = 25;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(1250);
    expect(producto.precio).toBe(1250);
  });

  it('debe calcular correctamente cuando el margen es 0%', () => {
    producto.costo = 500;
    producto.porcentaje = 0;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(500);
    expect(producto.precio).toBe(500);
  });

  it('debe aplicar margen por defecto de 15% cuando porcentaje no está definido en el producto', () => {
    producto.costo = 1000;
    producto.porcentaje = undefined;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(1150);
    expect(producto.precio).toBe(1150);
  });

  it('debe manejar costo cero dando precio cero', () => {
    producto.costo = 0;
    producto.porcentaje = 15;

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(0);
    expect(producto.precio).toBe(0);
  });

  it('debe calcular precios con decimales conservando el valor resultante', () => {
    producto.costo = 100;
    producto.porcentaje = 12.5; // 100 * 1.125 = 112.5

    const precio = producto.calcularPrecio();

    expect(precio.valor).toBe(112.5);
    expect(producto.precio).toBe(112.5);
  });

  it('debe lanzar un error si el costo no está definido (undefined o null)', () => {
    producto.costo = undefined;
    expect(() => producto.calcularPrecio()).toThrow('No se puede calcular el precio sin un costo definido');

    producto.costo = null as any;
    expect(() => producto.calcularPrecio()).toThrow('No se puede calcular el precio sin un costo definido');
  });

  it('debe lanzar un error si el costo es negativo', () => {
    producto.costo = -100;
    producto.porcentaje = 15;

    expect(() => producto.calcularPrecio()).toThrow('El costo no puede ser negativo');
  });

  it('debe lanzar un error si el costo es un valor no numérico o NaN', () => {
    producto.costo = NaN;
    expect(() => producto.calcularPrecio()).toThrow('El costo debe ser un número válido');

    producto.costo = Infinity;
    expect(() => producto.calcularPrecio()).toThrow('El costo debe ser un número válido');
  });

  it('debe rechazar el cálculo si el porcentaje almacenado es negativo a través del VO Margen', () => {
    producto.costo = 1000;
    producto.porcentaje = -10;

    expect(() => producto.calcularPrecio()).toThrow('El margen no puede ser negativo');
  });
});

describe('Producto Aggregate Root - CR-005 Denominación de Producto', () => {
  let producto: Producto;

  beforeEach(() => {
    producto = new Producto();
  });

  describe('componerDenominacion (TP-01 a TP-04)', () => {
    it('TP-01: debe componer la denominación estándar: Marca + Línea + Presentación', () => {
      producto.presentacion = '1.5L';
      const resultado = producto.componerDenominacion('Coca-Cola', 'Gaseosas');

      expect(resultado).toBe('Coca-Cola Gaseosas 1.5L');
      expect(producto.denominacion).toBe('Coca-Cola Gaseosas 1.5L');
    });

    it('TP-02: producto con Presentación válida y Marca/Línea con espacios extremos compone correctamente usando las tres partes saneadas', () => {
      producto.presentacion = '  Botella 750 cc  ';
      const resultado = producto.componerDenominacion('  Quilmes  ', '  Cervezas  ');

      expect(resultado).toBe('Quilmes Cervezas Botella 750 cc');
      expect(producto.denominacion).toBe('Quilmes Cervezas Botella 750 cc');
    });

    it('TP-02b: debe fallar si el producto carece de una Presentación válida (invariante obligatoria de CR-002, nunca omite presentación)', () => {
      producto.presentacion = '';
      expect(() => producto.componerDenominacion('Coca-Cola', 'Gaseosas')).toThrow(
        'La presentación no puede estar vacía',
      );

      (producto as any).presentacion = null;
      expect(() => producto.componerDenominacion('Coca-Cola', 'Gaseosas')).toThrow(
        'La presentación no puede ser nula ni indefinida',
      );

      (producto as any).presentacion = undefined;
      expect(() => producto.componerDenominacion('Coca-Cola', 'Gaseosas')).toThrow(
        'La presentación no puede ser nula ni indefinida',
      );
    });

    it('TP-03: debe utilizar la Presentación proveniente de CR-002 (VO Presentacion)', () => {
      producto.presentacion = '  Botella 750 cc  ';
      const resultado = producto.componerDenominacion('Quilmes', 'Cervezas');

      expect(resultado).toBe('Quilmes Cervezas Botella 750 cc');
      expect(producto.denominacion).toBe('Quilmes Cervezas Botella 750 cc');
    });

    it('TP-04: debe lanzar error si la denominación final supera los 255 caracteres', () => {
      producto.presentacion = '500g';
      const marcaLarga = 'M'.repeat(150);
      const lineaLarga = 'L'.repeat(120);

      expect(() =>
        producto.componerDenominacion(marcaLarga, lineaLarga),
      ).toThrow('Denominación inválida o excede 255 caracteres.');
    });

    it('debe lanzar error controlado si la marca es vacía o contiene solo espacios', () => {
      producto.presentacion = '1L';
      expect(() => producto.componerDenominacion('', 'Gaseosas')).toThrow(
        'Marca y Línea son obligatorias para componer la denominación.',
      );
      expect(() => producto.componerDenominacion('   ', 'Gaseosas')).toThrow(
        'Marca y Línea son obligatorias para componer la denominación.',
      );
    });

    it('debe lanzar error controlado si la línea es vacía o contiene solo espacios', () => {
      producto.presentacion = '1L';
      expect(() => producto.componerDenominacion('Coca-Cola', '')).toThrow(
        'Marca y Línea son obligatorias para componer la denominación.',
      );
      expect(() => producto.componerDenominacion('Coca-Cola', '   ')).toThrow(
        'Marca y Línea son obligatorias para componer la denominación.',
      );
    });
  });

  describe('actualizarDenominacion', () => {
    it('debe actualizar y sanear una denominación válida', () => {
      const resultado = producto.actualizarDenominacion('  Mi Denominación Especial  ');

      expect(resultado).toBe('Mi Denominación Especial');
      expect(producto.denominacion).toBe('Mi Denominación Especial');
    });

    it('debe lanzar error si la denominación es nula o indefinida', () => {
      expect(() => producto.actualizarDenominacion(null as any)).toThrow(
        'La denominación no puede ser nula ni indefinida',
      );
      expect(() => producto.actualizarDenominacion(undefined as any)).toThrow(
        'La denominación no puede ser nula ni indefinida',
      );
    });

    it('debe lanzar error si la denominación no es string', () => {
      expect(() => producto.actualizarDenominacion(123 as any)).toThrow(
        'La denominación debe ser una cadena de texto',
      );
    });

    it('debe lanzar error si la denominación está vacía o contiene solo espacios', () => {
      expect(() => producto.actualizarDenominacion('')).toThrow(
        'La denominación no puede estar vacía',
      );
      expect(() => producto.actualizarDenominacion('   ')).toThrow(
        'La denominación no puede estar vacía',
      );
    });

    it('debe lanzar error si la denominación excede los 255 caracteres', () => {
      const denLarga = 'A'.repeat(256);
      expect(() => producto.actualizarDenominacion(denLarga)).toThrow(
        'Denominación inválida o excede 255 caracteres.',
      );
    });

    it('debe aceptar denominación con exactamente 255 caracteres', () => {
      const denExacta = 'A'.repeat(255);
      const resultado = producto.actualizarDenominacion(denExacta);
      expect(resultado).toBe(denExacta);
      expect(producto.denominacion).toBe(denExacta);
    });
  });
});

