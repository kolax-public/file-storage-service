import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
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

  @ManyToOne(() => File, (file) => file.shares, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fileId' })
  file: File;
 
  @ManyToOne(() => Folder, (folder) => folder.shares, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @Column()
  shareLink: string;
}
