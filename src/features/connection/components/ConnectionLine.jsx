import { calculateConnectionPath } from "../utils/calculateConnectionPath";

function getObjectDimensions(object) {
  return object.resourceIds
    ? { width: 300, height: 220 }
    : { width: 260, height: 180 };
}

export default function ConnectionLine({ connection, source, target }) {
  const path = calculateConnectionPath(source, target);

  if (!path) return null;

  const sourceDimensions = getObjectDimensions(source);
  const targetDimensions = getObjectDimensions(target);
  const startX = source.x + sourceDimensions.width;
  const startY = source.y + sourceDimensions.height / 2;
  const endX = target.x;
  const endY = target.y + targetDimensions.height / 2;
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
