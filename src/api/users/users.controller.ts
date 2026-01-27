// src/users/users.controller.ts
import { Controller, Post, Put, Get, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
        return this.usersService.update(Number(id), dto);
    }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }
}
