import { mockResources } from "../../../data/mockResources";
import ResourceCard from "../../resource/components/ResourceCard";

export default function CanvasView() {
  const workspaceResources = mockResources.filter(
    (resource) => resource.workspaceId === "workspace-my",
  );

  return (
    <div className="canvas-placeholder" aria-label="Workspace canvas">
      <div className="canvas-content">
        <p className="canvas-label">Canvas area</p>
        {workspaceResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}
