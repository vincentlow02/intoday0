import ResourceTypeBadge from "../../resource/components/ResourceTypeBadge";

export default function CollectionItemPreview({ resource }) {
  return (
    <div className="collection-item-preview">
      <ResourceTypeBadge type={resource.type} />
      <span>{resource.title}</span>
    </div>
  );
}
