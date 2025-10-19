import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { File } from '../files/file.entity';
import { Folder } from '../folders/folder.entity';

@Entity()
export class Share {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  sharedWith: User;

  @Column()
  permission: 'view' | 'edit';

  @ManyToOne(() => File, { nullable: true })
  file: File;

  @ManyToOne(() => Folder, { nullable: true })
  folder: Folder;

  @Column()
  shareLink: string;
}
