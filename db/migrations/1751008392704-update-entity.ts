import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntity1751008392704 implements MigrationInterface {
    name = 'UpdateEntity1751008392704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "refreshToken" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refreshToken"`);
    }

}
