/** Precio es-AR del pipe currency (`$ 1.234,56`). */
export function parsePrecioUi(texto: string): number {
  const solo = texto.replace(/[^\d.,]/g, '');
  if (solo.includes(',') && solo.includes('.')) {
    return Number(solo.replace(/\./g, '').replace(',', '.'));
  }
  if (solo.includes(',')) {
    return Number(solo.replace(',', '.'));
  }
  return Number(solo);
}
