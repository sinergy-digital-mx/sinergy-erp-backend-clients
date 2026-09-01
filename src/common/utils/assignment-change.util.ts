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

const EMPTY_LABEL = 'Sin asignar';

export function assignmentValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
}

export function assignmentChange(
  field: string,
  fieldLabel: string,
  from: unknown,
  to: unknown,
  fromId?: string | null,
  toId?: string | null,
): AssignmentChangeItem | null {
  const previous = assignmentValue(from);
  const next = assignmentValue(to);
  if (previous === next && (fromId ?? null) === (toId ?? null)) {
    return null;
  }
  return {
    field,
    field_label: fieldLabel,
    from: previous,
    to: next,
    from_id: fromId ?? null,
    to_id: toId ?? null,
  };
}

export function compactAssignmentChanges(
  changes: Array<AssignmentChangeItem | null>,
): AssignmentChangeItem[] {
  return changes.filter((change): change is AssignmentChangeItem => change !== null);
}

export function buildAssignmentDescription(changes: AssignmentChangeItem[]): string {
  return changes
    .map(
      (change) =>
        `${change.field_label}: ${change.from ?? EMPTY_LABEL} → ${change.to ?? EMPTY_LABEL}`,
    )
    .join('; ');
}

export function formatAssignmentUserLabel(user?: {
  first_name?: string | null;
  last_name?: string | null;
  pos_user_code?: number | null;
  email?: string | null;
} | null): string | null {
  if (!user) return null;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  const withCode =
    name && user.pos_user_code != null ? `${name} (${user.pos_user_code})` : name;
  return withCode || user.email || null;
}

export function mapAssignmentActorName(actor?: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
} | null): string | null {
  if (!actor) return null;
  const name = [actor.first_name, actor.last_name].filter(Boolean).join(' ').trim();
  return name || actor.email || null;
}

export const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  assignment_initialized: 'Asignación inicial',
  assignment_updated: 'Cambio de asignación',
};
