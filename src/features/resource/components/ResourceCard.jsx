import ResourceTypeBadge from "./ResourceTypeBadge";

const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function ResourceCard({ resource }) {
  const position = {
    "--resource-x": `${resource.x}px`,
    "--resource-y": `${resource.y}px`,
  };

  return (
    <article className="resource-card" style={position}>
      <div className="resource-card-header">
        <ResourceTypeBadge type={resource.type} />
        <time dateTime={resource.updatedAt}>
          Updated {updatedAtFormatter.format(new Date(resource.updatedAt))}
        </time>
      </div>

      <h2 className="resource-card-title">{resource.title}</h2>
      <p className="resource-card-preview">{resource.preview}</p>

      <div className="resource-card-tags" aria-label="Resource tags">
        {resource.tags.map((tag) => (
          <span className="resource-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
