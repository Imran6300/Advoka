// §15 Deadlines — "Emerald → completed, Amber → approaching, Rose →
// overdue. Do not use color alone." There's no "mark complete" action yet
// in the MVP, so status is derived from `dueDate` vs now rather than
// stored — kept here (no mongoose import) so both the API response shaping
// and the client components can compute it identically.

export type DeadlineStatus = "overdue" | "approaching" | "upcoming";

export const DEADLINE_STATUS_LABEL: Record<DeadlineStatus, string> = {
  overdue: "Overdue",
  approaching: "Approaching",
  upcoming: "Upcoming",
};

const APPROACHING_WINDOW_DAYS = 7;

export function deadlineStatus(dueDate: string | Date, now: Date = new Date()): DeadlineStatus {
  const due = new Date(dueDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / msPerDay);

  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= APPROACHING_WINDOW_DAYS) return "approaching";
  return "upcoming";
}

export function daysRemainingLabel(dueDate: string | Date, now: Date = new Date()): string {
  const due = new Date(dueDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / msPerDay);

  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  }
  if (daysRemaining === 0) return "Due today";
  return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;
}
