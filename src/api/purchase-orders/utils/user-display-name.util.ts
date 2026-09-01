export function formatUserDisplayName(
  user?: { first_name?: string | null; last_name?: string | null } | null,
): string | null {
  if (!user) {
    return null;
  }
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || null;
}
