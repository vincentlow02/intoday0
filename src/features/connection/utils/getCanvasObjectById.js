export function getCanvasObjectById(id, resources, collections) {
  return (
    resources.find((resource) => resource.id === id) ||
    collections.find((collection) => collection.id === id) ||
    null
  );
}
