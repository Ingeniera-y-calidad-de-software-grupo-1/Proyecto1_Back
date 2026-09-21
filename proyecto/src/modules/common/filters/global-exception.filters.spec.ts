import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filters';

describe('GlobalExceptionFilter (CR-001)', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus };
    mockRequest = { url: '/productos', method: 'POST' };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('debe preservar mensajes en array provenientes de ValidationPipe/BadRequestException', () => {
    const exception = new BadRequestException(['El costo no puede ser negativo', 'El porcentaje no puede ser negativo']);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/productos',
        message: ['El costo no puede ser negativo', 'El porcentaje no puede ser negativo'],
      }),
    );
  });

  it('debe preservar mensaje string de BadRequestException', () => {
    const exception = new BadRequestException('El costo no puede ser negativo');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/productos',
        message: 'El costo no puede ser negativo',
      }),
    );
  });

  it('no debe exponer stack ni detalles internos en la respuesta enviada al cliente', () => {
    const exception = new BadRequestException('Error de validacion');

    filter.catch(exception, mockHost);

    const responsePayload = mockJson.mock.calls[0][0];
    expect(responsePayload.stack).toBeUndefined();
    expect(responsePayload.details).toBeUndefined();
    expect(responsePayload.statusCode).toBe(400);
    expect(responsePayload.message).toBe('Error de validacion');
  });

  it('debe responder con Internal Server Error genérico para errores desconocidos', () => {
    const exception = new Error('Database connection crashed');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const responsePayload = mockJson.mock.calls[0][0];
    expect(responsePayload.statusCode).toBe(500);
    expect(responsePayload.message).toBe('Internal Server Error');
    expect(responsePayload.stack).toBeUndefined();
  });
});
