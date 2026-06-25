export function getResourceTypeLabel(type) {
  const labels = {
    note: "Note",
    link: "Link",
    image: "Image",
    file: "File",
    pdf: "PDF",
  };

  return labels[type] || "Resource";
}
