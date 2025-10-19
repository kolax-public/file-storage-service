import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Folder } from '../folders/folder.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column({ default: false })
  isPublic: boolean;

  @ManyToOne(() => User, (user) => user.id)
  owner: User;

  @ManyToOne(() => Folder, (folder) => folder.id, { nullable: true })
  folder: Folder;
}
