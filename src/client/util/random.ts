export function random(length: number, charset: string) {
  let output = '';

  for (let i = 0; i < length; i++) {
    output += charset[Math.floor(Math.random() * charset.length)];
  }

  return output;
}

export function randomHex(length: number) {
  return random(length, '0123456789abcdef');
}
