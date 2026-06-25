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

      <div className="canvas-placeholder">
        <div className="canvas-placeholder-card">
          <p className="eyebrow">Canvas area</p>
          <h2>
            Resource cards, connection lines, and collections will appear here.
          </h2>
          <p>
            This placeholder confirms that the app shell, page layer, and future
            canvas area are separated correctly.
          </p>
        </div>
      </div>
    </section>
  );
}
