export function calcularAngulo(
  a: [number, number],
  b: [number, number],
  c: [number, number]
): number {
  const radianos =
    Math.atan2(c[1] - b[1], c[0] - b[0]) -
    Math.atan2(a[1] - b[1], a[0] - b[0]);
  let angulo = Math.abs((radianos * 180.0) / Math.PI);
  if (angulo > 180.0) angulo = 360 - angulo;
  return angulo;
}

export function calcularDistancia(
  p1: [number, number],
  p2: [number, number]
): number {
  return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}