import { getResourceTypeLabel } from "../utils/getResourceTypeLabel";

const typeIcons = {
  note: "✎",
  link: "↗",
  image: "▧",
  file: "□",
  pdf: "PDF",
};

export default function ResourceTypeBadge({ type }) {
  const label = getResourceTypeLabel(type);

  return (
    <span className="resource-type-badge">
      <span className="resource-type-icon" aria-hidden="true">
        {typeIcons[type] || "•"}
      </span>
      {label}
    </span>
  );
}
