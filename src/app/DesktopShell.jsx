import WorkspacePage from "../pages/WorkspacePage";
import WorkspaceHeader from "../features/workspace/components/WorkspaceHeader";
import GlobalModalRoot from "./modals/GlobalModalRoot";

export default function DesktopShell() {
  return (
    <div className="desktop-shell redesigned-shell">
      <WorkspaceHeader />

      <main className="redesigned-main">
        <WorkspacePage />
      </main>

      <GlobalModalRoot />
    </div>
  );
}
