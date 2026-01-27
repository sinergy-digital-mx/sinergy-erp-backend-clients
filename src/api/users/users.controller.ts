// src/users/users.controller.ts
import {
    Controller,
    Post,
    Put,
    Get,
    Body,
    Param,
    Req,
    UseGuards,
    Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import {
    RequireUserCreate,
    RequireUserRead,
    RequireUserUpdate,
    RequireUserDelete,
} from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @RequireUserCreate()
    create(@Body() dto: CreateUserDto, @Req() req) {
        return this.usersService.create(dto, req.user.tenant_id);
    }

    @Put(':id')
    @RequireUserUpdate()
    update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req) {
        return this.usersService.update(id, dto, req.user.tenant_id);
    }

    @Get()
    @RequireUserRead()
    findAll(@Req() req) {
        return this.usersService.findAll(req.user.tenant_id);
    }

    @Get(':id')
    @RequireUserRead()
    findOne(@Param('id') id: string, @Req() req) {
        return this.usersService.findOne(id, req.user.tenant_id);
    }

    @Delete(':id')
    @RequireUserDelete()
    remove(@Param('id') id: string, @Req() req) {
        // Note: This assumes you'll add a remove method to UsersService
        // return this.usersService.remove(id, req.user.tenant_id);
        throw new Error('Delete functionality not yet implemented in service');
    }
}
