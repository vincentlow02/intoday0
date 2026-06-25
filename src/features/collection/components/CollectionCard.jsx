import CollectionItemPreview from "./CollectionItemPreview";
import { CANVAS_OBJECT_DIMENSIONS } from "../../../lib/geometry/canvasObjectGeometry";

const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function CollectionCard({ collection, resources }) {
  const position = {
    "--collection-x": `${collection.x}px`,
    "--collection-y": `${collection.y}px`,
    width: `${CANVAS_OBJECT_DIMENSIONS.collection.width}px`,
    minHeight: `${CANVAS_OBJECT_DIMENSIONS.collection.height}px`,
  };
  const itemLabel = resources.length === 1 ? "item" : "items";

  return (
    <article className="collection-card" style={position}>
      <div className="collection-card-header">
        <span className="collection-card-kicker">Collection</span>
        <time dateTime={collection.updatedAt}>
          Updated {updatedAtFormatter.format(new Date(collection.updatedAt))}
        </time>
      </div>

      <h2 className="collection-card-title">{collection.title}</h2>
      <p className="collection-card-description">{collection.description}</p>

      <div className="collection-card-meta">
        {resources.length} {itemLabel}
      </div>

      <div className="collection-card-items">
        {resources.map((resource) => (
          <CollectionItemPreview key={resource.id} resource={resource} />
        ))}
      </div>

      <div className="collection-card-tags" aria-label="Collection tags">
        {collection.tags.map((tag) => (
          <span className="resource-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
