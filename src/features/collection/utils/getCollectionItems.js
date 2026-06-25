export function getCollectionItems(collection, resources) {
  return resources.filter((resource) =>
    collection.resourceIds.includes(resource.id),
  );
}
