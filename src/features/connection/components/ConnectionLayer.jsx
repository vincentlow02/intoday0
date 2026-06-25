import ConnectionLine from "./ConnectionLine";
import { getCanvasObjectById } from "../utils/getCanvasObjectById";

export default function ConnectionLayer({
  connections,
  resources,
  collections,
}) {
  return (
    <svg
      className="connection-layer"
      aria-hidden="true"
      width="100%"
      height="100%"
    >
      {connections.map((connection) => {
        const source = getCanvasObjectById(
          connection.sourceId,
          resources,
          collections,
        );
        const target = getCanvasObjectById(
          connection.targetId,
          resources,
          collections,
        );

        if (!source || !target) return null;

        return (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            source={source}
            target={target}
          />
        );
      })}
    </svg>
  );
}
