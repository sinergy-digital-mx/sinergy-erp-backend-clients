export type AssignmentChangeItem = {
    field: string;
    field_label: string;
    from: string | null;
    to: string | null;
    from_id?: string | null;
    to_id?: string | null;
};
export type AssignmentHistoryRow = {
    id: string;
    type: string;
    type_label: string;
    title: string;
    description: string | null;
    actor_id: string | null;
    actor_name: string | null;
    occurred_at: Date;
    changes: AssignmentChangeItem[];
};
export declare function assignmentValue(value: unknown): string | null;
export declare function assignmentChange(field: string, fieldLabel: string, from: unknown, to: unknown, fromId?: string | null, toId?: string | null): AssignmentChangeItem | null;
export declare function compactAssignmentChanges(changes: Array<AssignmentChangeItem | null>): AssignmentChangeItem[];
export declare function buildAssignmentDescription(changes: AssignmentChangeItem[]): string;
export declare function formatAssignmentUserLabel(user?: {
    first_name?: string | null;
    last_name?: string | null;
    pos_user_code?: number | null;
    email?: string | null;
} | null): string | null;
export declare function mapAssignmentActorName(actor?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
} | null): string | null;
export declare const ASSIGNMENT_TYPE_LABELS: Record<string, string>;
