import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntity1751005756966 implements MigrationInterface {
    name = 'UpdateEntity1751005756966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "classes" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_38f8de3ee0fa4d0342572070dd7" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_38f8de3ee0fa4d0342572070dd7"`);
        await queryRunner.query(`DROP TABLE "classes"`);
    }

}
