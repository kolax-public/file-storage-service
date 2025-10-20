import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1729260000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "firstName" character varying,
        "lastName" character varying,
        "picture" character varying,
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "folder" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "isPublic" boolean NOT NULL DEFAULT false,
        "parentId" integer,
        "ownerId" integer NOT NULL,
        CONSTRAINT "PK_folder_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "file" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "path" character varying NOT NULL,
        "isPublic" boolean NOT NULL DEFAULT false,
        "ownerId" integer NOT NULL,
        "folderId" integer,
        CONSTRAINT "PK_file_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "share" (
        "id" SERIAL NOT NULL,
        "permission" character varying NOT NULL,
        "shareLink" character varying NOT NULL,
        "sharedWithId" integer NOT NULL,
        "fileId" integer,
        "folderId" integer,
        CONSTRAINT "PK_share_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "folder"
      ADD CONSTRAINT "FK_parent_folder"
      FOREIGN KEY ("parentId") REFERENCES "folder"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "folder"
      ADD CONSTRAINT "FK_owner_folder"
      FOREIGN KEY ("ownerId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "file"
      ADD CONSTRAINT "FK_owner_file"
      FOREIGN KEY ("ownerId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "file"
      ADD CONSTRAINT "FK_folder_file"
      FOREIGN KEY ("folderId") REFERENCES "folder"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    
    await queryRunner.query(`
      ALTER TABLE "share"
      ADD CONSTRAINT "FK_sharedWith"
      FOREIGN KEY ("sharedWithId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "share"
      ADD CONSTRAINT "FK_file_share"
      FOREIGN KEY ("fileId") REFERENCES "file"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "share"
      ADD CONSTRAINT "FK_folder_share"
      FOREIGN KEY ("folderId") REFERENCES "folder"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "share" DROP CONSTRAINT "FK_folder_share"`);
    await queryRunner.query(`ALTER TABLE "share" DROP CONSTRAINT "FK_file_share"`);
    await queryRunner.query(`ALTER TABLE "share" DROP CONSTRAINT "FK_sharedWith"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_folder_file"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_owner_file"`);
    await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_owner_folder"`);
    await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_parent_folder"`);
    await queryRunner.query(`DROP TABLE "share"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TABLE "folder"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
