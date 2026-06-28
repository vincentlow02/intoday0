import { useState } from "react";
import WorkspacePage from "../pages/WorkspacePage";
import WorkspaceHeader from "../features/workspace/components/header/WorkspaceHeader";
import GlobalModalRoot from "./modals/GlobalModalRoot";

export default function DesktopShell() {
  const [activeView, setActiveView] = useState("Canvas");

  return (
    <div className="desktop-shell redesigned-shell desktop-canvas-scroll">
      <WorkspaceHeader activeView={activeView} setActiveView={setActiveView} />

      <main className="redesigned-main">
        <WorkspacePage activeView={activeView} />
      </main>

      <GlobalModalRoot />
    </div>
  );
}
