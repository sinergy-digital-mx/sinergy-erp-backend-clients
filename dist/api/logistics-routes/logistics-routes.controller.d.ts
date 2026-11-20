import { UpsertLogisticsRouteDto } from './dto/logistics-route.dto';
import { LogisticsRoutesService } from './logistics-routes.service';
export declare class LogisticsRoutesController {
    private readonly routes;
    constructor(routes: LogisticsRoutesService);
    list(active: string | undefined, req: any): Promise<import("../../entities/logistics/logistics-route.entity").LogisticsRoute[]>;
    create(dto: UpsertLogisticsRouteDto, req: any): Promise<import("../../entities/logistics/logistics-route.entity").LogisticsRoute>;
    update(id: string, dto: UpsertLogisticsRouteDto, req: any): Promise<import("../../entities/logistics/logistics-route.entity").LogisticsRoute>;
    remove(id: string, req: any): Promise<import("../../entities/logistics/logistics-route.entity").LogisticsRoute>;
    private assertCanRead;
    private assertCanWrite;
}
