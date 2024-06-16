import { HttpException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
const PDFDocument = require('pdfkit-table')
import { Readable } from 'stream'
import { User } from './entities/user.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { MESSAGE, STATUS_CODE } from 'src/constant/constant'
import { convertValuesInArray } from 'src/utils/common'
const fs = require('fs')
import type { Response } from 'express'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly user: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const userData = this.user.create(createUserDto)
    try {
      return await this.user.save(userData)
    } catch (err) {
      throw new HttpException(
        err?.sqlMessage || MESSAGE.SOMETHING_WENT_WRONG,
        STATUS_CODE.BAD_REQ,
      )
    }
  }

  async findAll() {
    return await this.user.find()
  }

  findOne(id: number) {
    return `This action returns a #${id} user`
  }

  async update(id: any, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const existingUser = await this.user.findOneBy({ id })
      if (!existingUser) {
        throw new NotFoundException()
      }
      const userData = this.user.merge(existingUser, updateUserDto)
      return await this.user.save(userData)
    } catch (err) {
      throw new HttpException(
        err?.sqlMessage || err?.message || MESSAGE.SOMETHING_WENT_WRONG,
        err?.status || STATUS_CODE.BAD_REQ,
      )
    }
  }

  async remove(id: number) {
    try {
      const existingUser = await this.user.findOneBy({ id })
      if (!existingUser) {
        throw new NotFoundException()
      }
      return await this.user.delete({ id })
    } catch (err) {
      throw new HttpException(
        err?.sqlMessage || err?.message || MESSAGE.SOMETHING_WENT_WRONG,
        err?.status || STATUS_CODE.BAD_REQ,
      )
    }
  }

  async pdfGenerator(res: Response | string): Promise<any> {
    try {
      const usersData = await this.user.find()
      const convertedData = convertValuesInArray(usersData)
      const doc = new PDFDocument({ margin: 30, size: 'A4' })

      const writeStream = fs.createWriteStream('./document.pdf')
      const writePromise = new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(true))
        writeStream.on('error', () => reject(false))
      })

      doc.pipe(writeStream)

      const table = {
        title: 'User Data',
        subtitle: 'latest user data generated',
        headers: ['ID', 'Name', 'Email', 'Phone Number', 'Address'],
        rows: convertedData,
      }

      await doc.table(table, {})

      if (res) {
        doc.pipe(res)
      }

      doc.end()
      const writeFRes = await writePromise
      return writeFRes
    } catch (err) {
      throw new HttpException(
        err?.sqlMessage || err?.message || MESSAGE.SOMETHING_WENT_WRONG,
        err?.status || STATUS_CODE.BAD_REQ,
      )
    }
  }

  getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)
    return stream
  }
}
