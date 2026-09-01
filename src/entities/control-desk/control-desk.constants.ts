/** Estados del job de Mesa de Control (la OV sigue en En Selección / Lista para entrega). */
export const CONTROL_DESK_JOB_STATUSES = [
  'released',
  'picking',
  'waiting_assembly',
  'assembling',
  'assembled',
  'cancelled',
] as const;

export type ControlDeskJobStatus = (typeof CONTROL_DESK_JOB_STATUSES)[number];

export const CONTROL_DESK_TASK_STATUSES = [
  'pending',
  'in_progress',
  'picked',
  'short',
  'cancelled',
] as const;

export type ControlDeskTaskStatus = (typeof CONTROL_DESK_TASK_STATUSES)[number];

export const CONTROL_DESK_LINE_STATUSES = [
  'pending',
  'picked',
  'short',
  'cancelled',
] as const;

export type ControlDeskLineStatus = (typeof CONTROL_DESK_LINE_STATUSES)[number];

export const CONTROL_DESK_TERMINAL_TASK_STATUSES: ControlDeskTaskStatus[] = [
  'picked',
  'short',
];
