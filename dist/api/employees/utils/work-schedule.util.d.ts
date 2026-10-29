export declare const WORK_WEEKDAYS: readonly [1, 2, 3, 4, 5, 6, 7];
export type WorkWeekday = (typeof WORK_WEEKDAYS)[number];
export declare const WORK_WEEKDAY_LABELS: Record<WorkWeekday, string>;
export interface WorkScheduleDay {
    weekday: WorkWeekday;
    is_workday: boolean;
    start_time: string | null;
    end_time: string | null;
    hours: number;
}
export interface WorkSchedule {
    days: WorkScheduleDay[];
    weekly_hours: number;
    notes: string | null;
}
export interface WorkScheduleDayInput {
    weekday: number;
    is_workday: boolean;
    start_time?: string | null;
    end_time?: string | null;
}
export declare function hoursBetweenClocks(startTime: string | null | undefined, endTime: string | null | undefined): number | null;
export declare function draftWorkSchedule(): WorkSchedule;
export declare function presentWorkSchedule(raw: unknown): WorkSchedule | null;
export declare function resolveWorkSchedule(raw: unknown): {
    ok: true;
    schedule: WorkSchedule;
} | {
    ok: false;
    message: string;
};
