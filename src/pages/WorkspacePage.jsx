import CanvasView from "../features/canvas/components/CanvasView";
import WorkspaceHeader from "../features/workspace/components/WorkspaceHeader";

export default function WorkspacePage() {
  return (
    <section className="workspace-page">
      <WorkspaceHeader />
      <CanvasView />
    </section>
  );
}
