export function serialize(data: any) {
  if (typeof data === 'object') {
    return JSON.stringify(data);
  }

  return data;
}
