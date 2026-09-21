import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperLinea1789955327840 implements MigrationInterface {
  name = 'AddSuperLinea1789955327840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear la tabla SuperLinea.
    await queryRunner.query(`
      CREATE TABLE \`superlinea\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`denominacion\` varchar(255) NOT NULL,
        \`observacion\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`usuarioCreatedId\` int NULL,
        \`usuarioDeletedId\` int NULL,
        \`usuarioUpdatedId\` int NULL,
        \`sistema\` int NOT NULL DEFAULT '0',
        UNIQUE INDEX \`IDX_1efec6d030d75f5eee606d5a8c\`
          (\`denominacion\`, \`deletedAt\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Incorporar temporalmente la relación como nullable.
    await queryRunner.query(`
      ALTER TABLE \`linea\`
      ADD \`superLineaId\` int NULL
    `);

    // 3. Crear la SuperLínea transitoria para los datos existentes.
    await queryRunner.query(`
      INSERT INTO \`superlinea\`
        (\`denominacion\`, \`observacion\`, \`sistema\`)
      VALUES
        (
          'Sin clasificar',
          'SuperLínea creada durante la migración CR-003 para clasificar líneas existentes.',
          0
        )
    `);

    // 4. Asignar todas las líneas existentes a "Sin clasificar".
    await queryRunner.query(`
      UPDATE \`linea\`
      SET \`superLineaId\` = LAST_INSERT_ID()
      WHERE \`superLineaId\` IS NULL
    `);

    // 5. Convertir la relación en obligatoria.
    await queryRunner.query(`
      ALTER TABLE \`linea\`
      MODIFY \`superLineaId\` int NOT NULL
    `);

    // 6. Crear la FK definitiva.
    await queryRunner.query(`
      ALTER TABLE \`linea\`
      ADD CONSTRAINT \`FK_5ba40749e46ade98021c5453b79\`
      FOREIGN KEY (\`superLineaId\`)
      REFERENCES \`superlinea\`(\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`linea\`
      DROP FOREIGN KEY \`FK_5ba40749e46ade98021c5453b79\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`linea\`
      DROP COLUMN \`superLineaId\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_1efec6d030d75f5eee606d5a8c\`
      ON \`superlinea\`
    `);

    await queryRunner.query(`
      DROP TABLE \`superlinea\`
    `);
  }
}