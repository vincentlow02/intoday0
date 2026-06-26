import WorkspacePrompt from '../features/workspace/components/WorkspacePrompt';

export default function WorkspacePage() {
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
