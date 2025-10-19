import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { File } from '../files/file.entity';

@Entity()
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Folder, (folder) => folder.children, { nullable: true })
  parent: Folder;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children: Folder[];

  @OneToMany(() => File, (file) => file.folder)
  files: File[];

  @Column({ default: false })
  isPublic: boolean;

  @ManyToOne(() => User, (user) => user.id)
  owner: User;
}
