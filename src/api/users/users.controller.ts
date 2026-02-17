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

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // All user management endpoints have been moved to /api/tenant/users
    // This controller is kept for backward compatibility but all endpoints are disabled
    // Use /api/tenant/users instead for all user management operations
}

