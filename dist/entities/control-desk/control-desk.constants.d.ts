export declare const CONTROL_DESK_JOB_STATUSES: readonly ["released", "picking", "waiting_assembly", "assembling", "assembled", "cancelled"];
export type ControlDeskJobStatus = (typeof CONTROL_DESK_JOB_STATUSES)[number];
export declare const CONTROL_DESK_TASK_STATUSES: readonly ["pending", "in_progress", "picked", "short", "cancelled"];
export type ControlDeskTaskStatus = (typeof CONTROL_DESK_TASK_STATUSES)[number];
export declare const CONTROL_DESK_LINE_STATUSES: readonly ["pending", "picked", "short", "cancelled"];
export type ControlDeskLineStatus = (typeof CONTROL_DESK_LINE_STATUSES)[number];
export declare const CONTROL_DESK_TERMINAL_TASK_STATUSES: ControlDeskTaskStatus[];
