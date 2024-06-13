// database.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { DataSource } from 'typeorm'

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    await this.createDatabase()
  }

  private async createDatabase() {
    try {
      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.query(`CREATE DATABASE IF NOT EXISTS WORLD`)
      await queryRunner.release()
      console.log('Database created successfully.')
    } catch (error) {
      console.error('Error creating database:', error)
    }
  }
}
