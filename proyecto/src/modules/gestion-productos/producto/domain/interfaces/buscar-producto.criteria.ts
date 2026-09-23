export interface BuscarProductoCriteria {
  denominacion?: string;
  denominacionLinea?: string;
  denominacionSuperLinea?: string;
  codigoProveedor?: string;
  codProveedorExacto?: boolean;
  codigoReferencia?: string;
  codReferenciaExacto?: boolean;
  marcaId?: number;
  lineaId?: number;
  proveedorId?: number;
  conStock?: boolean;
  skip?: number;
  take?: number;
}
