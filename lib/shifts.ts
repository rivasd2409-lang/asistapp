export function getLocalDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 10);
}

export function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);

  return start;
}

export function parseWeekStart(value?: string | null) {
  if (!value) {
    return getWeekStart();
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return getWeekStart();
  }

  return getWeekStart(parsed);
}

export function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

export function getWeekRange(weekStart: Date) {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);

  return { start, end };
}

export function formatShiftDay(date: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatShiftTime(date: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatShiftDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getShiftDateInputValue(date: Date) {
  return getLocalDateInputValue(date);
}

export function getShiftTimeInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(11, 16);
}

export function getShiftDateTimeInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}
