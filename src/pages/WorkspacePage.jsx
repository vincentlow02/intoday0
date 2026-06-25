import CanvasView from "../features/canvas/components/CanvasView";

export default function WorkspacePage() {
  return (
    <section className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">IntoDay architecture</p>
          <h1>Workspace / Canvas / Resource / Collection</h1>
          <p>
            This is the clean frontend shell. The next steps will add shared UI,
            mock data, workspace sidebar, canvas, resource cards, collections,
            and connections.
          </p>
        </div>

        <div className="workspace-header-actions">
          <button className="shell-button">Add Resource</button>
          <button className="shell-button secondary">Settings</button>
        </div>
      </header>

      <CanvasView />
    </section>
  );
}
