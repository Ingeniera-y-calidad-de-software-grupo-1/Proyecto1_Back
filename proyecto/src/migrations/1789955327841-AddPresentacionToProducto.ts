import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPresentacionToProducto1789955327841 implements MigrationInterface {
  name = 'AddPresentacionToProducto1789955327841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Incorporar temporalmente la columna como nullable
    await queryRunner.query(`
      ALTER TABLE \`producto\`
      ADD \`presentacion\` varchar(50) NULL
    `);

    // 2. Regularizar los productos existentes con un valor explícito controlado ("Sin especificar")
    await queryRunner.query(`
      UPDATE \`producto\`
      SET \`presentacion\` = 'Sin especificar'
      WHERE \`presentacion\` IS NULL OR TRIM(\`presentacion\`) = ''
    `);

    // 3. Convertir la columna en NOT NULL
    await queryRunner.query(`
      ALTER TABLE \`producto\`
      MODIFY \`presentacion\` varchar(50) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`producto\`
      DROP COLUMN \`presentacion\`
    `);
  }
}
