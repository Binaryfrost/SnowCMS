interface ObjectWithId {
  id: string
  [x: string]: any
}

export function getById<T extends ObjectWithId>(array: T[], id: string): T {
  return array.filter((a) => a.id === id)[0];
}
