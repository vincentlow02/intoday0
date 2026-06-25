export const CANVAS_OBJECT_TYPES = {
  resource: "resource",
  collection: "collection",
};

export const CANVAS_OBJECT_DIMENSIONS = {
  resource: {
    width: 260,
    height: 180,
  },
  collection: {
    width: 300,
    height: 220,
  },
};

export function getCanvasObjectType(object) {
  if (!object) return null;

  if (Array.isArray(object.resourceIds)) {
    return CANVAS_OBJECT_TYPES.collection;
  }

  return CANVAS_OBJECT_TYPES.resource;
}

export function getCanvasObjectDimensions(object) {
  const type = getCanvasObjectType(object);

  if (!type) {
    return {
      width: 0,
      height: 0,
    };
  }

  return CANVAS_OBJECT_DIMENSIONS[type];
}

export function getCanvasObjectAnchorPoints(object) {
  const dimensions = getCanvasObjectDimensions(object);

  return {
    left: {
      x: object.x,
      y: object.y + dimensions.height / 2,
    },
    right: {
      x: object.x + dimensions.width,
      y: object.y + dimensions.height / 2,
    },
    center: {
      x: object.x + dimensions.width / 2,
      y: object.y + dimensions.height / 2,
    },
  };
}
