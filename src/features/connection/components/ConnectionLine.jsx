import { calculateConnectionPath } from "../utils/calculateConnectionPath";
import { getCanvasObjectAnchorPoints } from "../../../lib/geometry/canvasObjectGeometry";

export default function ConnectionLine({ connection, source, target }) {
  const path = calculateConnectionPath(source, target);

  if (!path) return null;

  const sourceAnchors = getCanvasObjectAnchorPoints(source);
  const targetAnchors = getCanvasObjectAnchorPoints(target);
  const startX = sourceAnchors.right.x;
  const startY = sourceAnchors.right.y;
  const endX = targetAnchors.left.x;
  const endY = targetAnchors.left.y;
  const labelX = (startX + endX) / 2;
  const labelY = (startY + endY) / 2 - 8;

  return (
    <g>
      <path className="connection-line" d={path} />
      {connection.label ? (
        <text
          className="connection-label"
          x={labelX}
          y={labelY}
          textAnchor="middle"
        >
          {connection.label}
        </text>
      ) : null}
    </g>
  );
}
