import { BadRequestException } from '@nestjs/common';
import { SuperLineaDeletionPolicy } from './superlinea-deletion.policy';
import { ISuperLineaRepository } from '../interfaces/superlinea.repository.interface';

describe('SuperLineaDeletionPolicy - CR003', () => {
  let policy: SuperLineaDeletionPolicy;
  let repository: jest.Mocked<ISuperLineaRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByDenominacion: jest.fn(),
      findAll: jest.fn(),
      findByDenominacionFiltered: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      hasActiveLineas: jest.fn(),
    };

    policy = new SuperLineaDeletionPolicy(repository);
  });

  it('debe permitir eliminar una SuperLínea cuando no tiene Líneas activas asociadas', async () => {
    repository.hasActiveLineas.mockResolvedValue(false);

    await expect(policy.validate(1)).resolves.toBeUndefined();

    expect(repository.hasActiveLineas).toHaveBeenCalledWith(1);
  });

  it('debe impedir eliminar una SuperLínea cuando tiene Líneas activas asociadas', async () => {
    repository.hasActiveLineas.mockResolvedValue(true);

    await expect(policy.validate(1)).rejects.toThrow(
      BadRequestException,
    );

    expect(repository.hasActiveLineas).toHaveBeenCalledWith(1);
  });

  it('debe informar el motivo cuando intenta eliminar una SuperLínea con Líneas activas', async () => {
    repository.hasActiveLineas.mockResolvedValue(true);

    await expect(policy.validate(1)).rejects.toThrow(
      'No se puede eliminar la superlínea porque tiene líneas activas asociadas.',
    );
  });
});