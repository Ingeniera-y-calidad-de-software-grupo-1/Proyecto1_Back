import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHistorialPrecio1789955327850 implements MigrationInterface {
  name = 'CreateHistorialPrecio1789955327850';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`historial_precio\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`producto_id\` int NOT NULL,
        \`precio_anterior\` decimal(15,5) NOT NULL,
        \`precio_nuevo\` decimal(15,5) NOT NULL,
        \`fecha\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`motivo\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_historial_precio_producto_fecha\` (\`producto_id\`, \`fecha\`),
        CONSTRAINT \`FK_historial_precio_producto\`
          FOREIGN KEY (\`producto_id\`)
          REFERENCES \`producto\` (\`id\`)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`historial_precio\`
      DROP FOREIGN KEY \`FK_historial_precio_producto\`
    `);

    await queryRunner.query(`
      DROP TABLE \`historial_precio\`
    `);
  }
}
