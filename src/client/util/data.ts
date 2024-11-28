interface ObjectWithId {
  id: string
  [x: string]: any
}

export function getIndexById<T extends ObjectWithId>(array: T[], id: string): number {
  let index = null;

  array.forEach((a, i) => {
    if (a.id === id) {
      index = i;
    }
  });

  return index;
}

export function getById<T extends ObjectWithId>(array: T[], id: string): T {
  const index = getIndexById(array, id);
  if (index === null) return null;
  return array[index];
}

export function formatDate(date: Date) {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
