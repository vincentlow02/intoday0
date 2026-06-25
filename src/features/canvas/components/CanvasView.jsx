import { mockCollections } from "../../../data/mockCollections";
import { mockConnections } from "../../../data/mockConnections";
import { mockResources } from "../../../data/mockResources";
import CollectionCard from "../../collection/components/CollectionCard";
import { getCollectionItems } from "../../collection/utils/getCollectionItems";
import ConnectionLayer from "../../connection/components/ConnectionLayer";
import ResourceCard from "../../resource/components/ResourceCard";

export default function CanvasView() {
  const workspaceResources = mockResources.filter(
    (resource) => resource.workspaceId === "workspace-my",
  );
  const workspaceCollections = mockCollections.filter(
    (collection) => collection.workspaceId === "workspace-my",
  );
  const workspaceConnections = mockConnections.filter(
    (connection) => connection.workspaceId === "workspace-my",
  );

  return (
    <div className="canvas-placeholder" aria-label="Workspace canvas">
      <div className="canvas-content">
        <p className="canvas-label">Canvas area</p>
        <ConnectionLayer
          connections={workspaceConnections}
          resources={workspaceResources}
          collections={workspaceCollections}
        />
        <div className="canvas-object-layer">
          {workspaceResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
          {workspaceCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              resources={getCollectionItems(collection, workspaceResources)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
