export function withAlpha(hexColor: string, alpha: number): string {
  const sanitized = hexColor.replace('#', '');
  const fullHex = sanitized.length === 3
    ? sanitized
        .split('')
        .map((char) => char + char)
        .join('')
    : sanitized;

  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${fullHex}${alphaHex}`;
}
