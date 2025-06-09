export function complementHex(hex: string) {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const rComplement = (255 - r).toString(16).padStart(2, '0');
  const gComplement = (255 - g).toString(16).padStart(2, '0');
  const bComplement = (255 - b).toString(16).padStart(2, '0');

  return darkenHexColor(`#${rComplement}${gComplement}${bComplement}`, 10);
}

export function darkenHexColor(hex: string, amount: number) {
  let sanitizedHex = hex.replace('#', '');

  if (sanitizedHex.length === 3) {
    sanitizedHex = sanitizedHex
      .split('')
      .map(char => char + char)
      .join('');
  }

  const r = parseInt(sanitizedHex.substring(0, 2), 16);
  const g = parseInt(sanitizedHex.substring(2, 4), 16);
  const b = parseInt(sanitizedHex.substring(4, 6), 16);

  const darkR = Math.max(0, Math.min(255, r - amount));
  const darkG = Math.max(0, Math.min(255, g - amount));
  const darkB = Math.max(0, Math.min(255, b - amount));

  const darkRHex = darkR.toString(16).padStart(2, '0');
  const darkGHex = darkG.toString(16).padStart(2, '0');
  const darkBHex = darkB.toString(16).padStart(2, '0');

  return `#${darkRHex}${darkGHex}${darkBHex}`;
}
