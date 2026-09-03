import { PosUserType } from '../../../entities/users/pos-user-type.enum';
import { EmployeeProfileDto } from '../../employees/dto/employee-profile.dto';
export declare class CreateUserDto {
    status_id: number;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    language_code?: string;
    billing_branch_id?: string | null;
    billing_branch_ids?: string[];
    primary_billing_branch_id?: string | null;
    is_pos_user?: boolean;
    pos_user_code?: number;
    pos_user_type?: PosUserType;
    is_employee?: boolean;
    is_manager?: boolean;
    employee?: EmployeeProfileDto;
    warehouse_ids?: string[];
}
