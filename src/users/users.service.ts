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

  // async pdfGenerator(): Promise<Buffer> {
  //   const usersData = await this.user.find()

  //   const pdfBuffer: Buffer = await new Promise((resolve) => {
  //     const doc = new PDFDocument({ margin: 30, size: 'A4' })
  //     doc.text(JSON.stringify(usersData))
  //     doc.text(JSON.stringify(usersData))

  //     doc.moveDown()
  //     doc.text('I am last')
  //     const buffer = []
  //     doc.on('data', buffer.push.bind(buffer))
  //     doc.on('end', () => {
  //       const data = Buffer.concat(buffer)
  //       resolve(data)
  //     })
  //     doc.end()
  //   })
  //   return pdfBuffer
  // }

  async pdfGenerator(res: Response | string): Promise<any> {
    try {
      const usersData = await this.user.find()
      const convertedData = convertValuesInArray(usersData)
      const doc = new PDFDocument({ margin: 30, size: 'A4' })
      // save document
      const writeStream = fs.createWriteStream('./document.pdf')
      const writePromise = new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(true))
        writeStream.on('error', () => reject(false))
      })
      // doc.pipe(fs.createWriteStream('./document.pdf'))
      doc.pipe(writeStream)
      // ;(async function () {
      // table
      const table = {
        title: 'User Data',
        subtitle: 'latest user data generated',
        headers: ['ID', 'Name', 'Email', 'Phone Number', 'Address'],
        rows: convertedData,
      }
      // A4 595.28 x 841.89 (portrait) (about width sizes)
      // width
      // or columnsSize
      await doc.table(table, {
        // columnsSize: [200, 100, 100],
      })
      // done!
      // doc.end()
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
