import WorkspacePage from "../pages/WorkspacePage";
import GlobalModalRoot from "./modals/GlobalModalRoot";

export default function DesktopShell() {
  return (
    <div className="desktop-shell">
      <aside className="desktop-sidebar">
        <div className="app-brand">
          <div className="app-brand-mark">I</div>
          <div>
            <div className="app-brand-name">IntoDay</div>
            <div className="app-brand-subtitle">Clean frontend shell</div>
          </div>
        </div>

        <nav className="sidebar-section">
          <div className="sidebar-label">Workspace</div>
          <button className="sidebar-item active">My Workspace</button>
          <button className="sidebar-item">Schoolwork</button>
          <button className="sidebar-item">Portfolio</button>
        </nav>

        <div className="sidebar-footer">
          <span>Step 2 shell</span>
        </div>
      </aside>

      <main className="desktop-main">
        <WorkspacePage />
      </main>

      <GlobalModalRoot />
    </div>
  );
}
