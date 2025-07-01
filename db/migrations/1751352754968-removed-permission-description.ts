import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovedPermissionDescription1751352754968 implements MigrationInterface {
    name = 'RemovedPermissionDescription1751352754968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "description"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" ADD "description" character varying`);
    }

}
