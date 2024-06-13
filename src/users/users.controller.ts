import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  StreamableFile,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
const fs = require('fs')
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import type { Response } from 'express'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id)
  }

  @Patch(':id')
  @UsePipes(ValidationPipe)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id)
  }

  @Get('pdf/view')
  async downloadPDF(@Res() res): Promise<void> {
    await this.usersService.pdfGenerator(res)
  }

  @Get('pdf/download')
  async getFile(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const isPDFGenerated = await this.usersService.pdfGenerator('')
    if (isPDFGenerated) {
      const file = fs.readFileSync('document.pdf')
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="userData.pdf"',
      })
      return new StreamableFile(Buffer.from(file))
    }
  }
}
