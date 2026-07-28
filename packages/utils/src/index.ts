export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString();
}

export function isPastDate(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}
