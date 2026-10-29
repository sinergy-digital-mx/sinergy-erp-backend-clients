export declare class WorkScheduleDayDto {
    weekday: number;
    is_workday: boolean;
    start_time?: string | null;
    end_time?: string | null;
}
export declare class UpsertWorkScheduleDto {
    days: WorkScheduleDayDto[];
    notes?: string | null;
}
