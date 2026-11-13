export function createId(): string {
  const time = Date.now().toString(36);
  const random = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 36 ** 4)
      .toString(36)
      .padStart(4, '0'),
  ).join('');
  return `${time}${random}`;
}
