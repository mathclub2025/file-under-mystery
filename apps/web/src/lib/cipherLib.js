export function caesar(text, shift) {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c >= "a" && c <= "z" ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

export function vigenere(text, key, decrypt = false) {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!cleanKey) return text;
  let keyIdx = 0;
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c >= "a" && c <= "z" ? 97 : 65;
    const kShift = cleanKey.charCodeAt(keyIdx % cleanKey.length) - 65;
    const shift = decrypt ? (26 - kShift) % 26 : kShift;
    keyIdx++;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
}
