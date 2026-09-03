import { Property } from './property.entity';
export declare class MeasurementUnit {
    id: string;
    code: string;
    name: string;
    symbol: string;
    description: string;
    system: string;
    properties: Property[];
    created_at: Date;
}
