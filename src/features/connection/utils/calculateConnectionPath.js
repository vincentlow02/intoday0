import { getCanvasObjectAnchorPoints } from "../../../lib/geometry/canvasObjectGeometry";

export function calculateConnectionPath(source, target) {
  if (!source || !target) return "";

  const sourceAnchors = getCanvasObjectAnchorPoints(source);
  const targetAnchors = getCanvasObjectAnchorPoints(target);

  const startX = sourceAnchors.right.x;
  const startY = sourceAnchors.right.y;
  const endX = targetAnchors.left.x;
  const endY = targetAnchors.left.y;

  const controlOffset = Math.max(120, Math.abs(endX - startX) * 0.5);

  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
}
