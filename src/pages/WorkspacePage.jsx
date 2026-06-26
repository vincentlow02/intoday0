import WorkspacePrompt from '../features/workspace/components/WorkspacePrompt';
import '../features/workspace/styles/workspace-page.css';
import '../features/canvas/styles/canvas.css';

export default function WorkspacePage({ activeView = "Canvas" }) {
  if (activeView === "Collection") {
    return (
      <section className="workspace-page redesigned-workspace-page">
        <div
          className="redesign-empty-canvas desktop-canvas-scroll"
          aria-label="Blank redesign workspace"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <div style={{ color: 'var(--color-muted)', fontSize: '1.2rem' }}>
            Collection View Placeholder
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page redesigned-workspace-page">
      <div
        className="redesign-empty-canvas desktop-canvas-scroll"
        aria-label="Blank redesign workspace"
      >
        <WorkspacePrompt />
      </div>
    </section>
  );
}
