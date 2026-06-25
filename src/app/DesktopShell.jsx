import WorkspacePage from "../pages/WorkspacePage";
import WorkspaceSidebar from "../features/workspace/components/WorkspaceSidebar";
import GlobalModalRoot from "./modals/GlobalModalRoot";

export default function DesktopShell() {
  return (
    <div className="desktop-shell">
      <WorkspaceSidebar />

      <main className="desktop-main">
        <WorkspacePage />
      </main>

      <GlobalModalRoot />
    </div>
  );
}
