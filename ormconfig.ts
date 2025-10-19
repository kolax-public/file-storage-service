import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'example',
  database: process.env.DB_NAME || 'filedb',
  entities: ['src/**/*.entity.ts'],
  migrations: ['migrations/*.ts'],
  synchronize: false,
});
