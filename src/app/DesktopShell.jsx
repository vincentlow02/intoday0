import { useState } from "react";
import WorkspacePage from "../pages/WorkspacePage";
import WorkspaceHeader from "../features/workspace/components/header/WorkspaceHeader";
import GlobalModalRoot from "./modals/GlobalModalRoot";

export default function DesktopShell() {
  const [activeView, setActiveView] = useState("Canvas");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  return (
    <div className="desktop-shell redesigned-shell desktop-canvas-scroll">
      <WorkspaceHeader 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isAvatarMenuOpen={isAvatarMenuOpen}
        setIsAvatarMenuOpen={setIsAvatarMenuOpen}
      />

      <main className="redesigned-main">
        <WorkspacePage 
          activeView={activeView} 
          isAvatarMenuOpen={isAvatarMenuOpen}
        />
      </main>

      <GlobalModalRoot />
    </div>
  );
}
