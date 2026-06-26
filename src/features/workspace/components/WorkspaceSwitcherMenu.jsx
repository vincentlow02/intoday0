export default function WorkspaceSwitcherMenu() {
  return (
    <div className="workspace-switcher-menu">
      <div className="workspace-switcher-menu-header">
        <div className="workspace-switcher-menu-header-text">My Spaces</div>
      </div>
      
      <div className="workspace-switcher-menu-list">
        <div className="workspace-switcher-item">
          <div className="workspace-switcher-item-name-wrap">
            <div className="workspace-switcher-item-name">Untitled</div>
          </div>
          <div className="workspace-switcher-item-actions">
            <div className="workspace-switcher-item-actions-icon">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          </div>
        </div>
        <div className="workspace-switcher-item">
          <div className="workspace-switcher-item-name-wrap">
            <div className="workspace-switcher-item-name">Untitled</div>
          </div>
          <div className="workspace-switcher-item-actions">
            <div className="workspace-switcher-item-actions-icon">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          </div>
        </div>
        <div className="workspace-switcher-item active">
          <div className="workspace-switcher-item-name-wrap">
            <div className="workspace-switcher-item-name">Untitled 2</div>
          </div>
          <div className="workspace-switcher-item-actions">
            <div className="workspace-switcher-item-actions-icon active-icon">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          </div>
        </div>
      </div>

      <div className="workspace-switcher-footer">
        <div className="workspace-switcher-footer-inner">
          <div className="workspace-switcher-plan">
            <div className="workspace-switcher-plan-header">
              <div className="workspace-switcher-plan-title">
                <div className="workspace-switcher-plan-icon">
                  <div className="workspace-switcher-plan-icon-text">ⓘ</div>
                </div>
                <div className="workspace-switcher-plan-text-wrap">
                  <div className="workspace-switcher-plan-text">Free plan limit reached</div>
                </div>
              </div>
              <div className="workspace-switcher-plan-count-wrap">
                <div className="workspace-switcher-plan-count">3/3</div>
              </div>
            </div>
            <div className="workspace-switcher-plan-bar-bg">
              <div className="workspace-switcher-plan-bar-fill" />
            </div>
          </div>
          <div className="workspace-switcher-add">
            <div className="workspace-switcher-add-icon-wrap">
              <div className="workspace-switcher-add-icon" />
            </div>
            <div className="workspace-switcher-add-text-wrap">
              <div className="workspace-switcher-add-text">Add workspace</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
