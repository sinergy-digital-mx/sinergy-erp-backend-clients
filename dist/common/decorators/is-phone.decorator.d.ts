import { ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
export declare class IsPhoneConstraint implements ValidatorConstraintInterface {
    validate(value: any): boolean;
    defaultMessage(): string;
}
export declare function IsPhone(validationOptions?: ValidationOptions): (target: Object, propertyName: string) => void;
