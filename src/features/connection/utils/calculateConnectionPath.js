export function calculateConnectionPath(source, target) {
  if (!source || !target) return "";

  const sourceWidth = source.resourceIds ? 300 : 260;
  const sourceHeight = source.resourceIds ? 220 : 180;
  const targetHeight = target.resourceIds ? 220 : 180;

  const startX = source.x + sourceWidth;
  const startY = source.y + sourceHeight / 2;
  const endX = target.x;
  const endY = target.y + targetHeight / 2;

  const controlOffset = Math.max(120, Math.abs(endX - startX) * 0.5);

  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
}
