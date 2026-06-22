const fs = require('fs');

const codeToExtract = `import React from 'react';
import { ZoomChevronIcon } from './icons/AppIcons';

const DesktopZoomControl = ({
  zoomScale,
  isZoomMenuOpen,
  onToggleZoomMenu,
  onZoomPresetSelect,
}) => (
  <div className="desktop-zoom-menu-anchor">
    <button
      type="button"
      className={\`desktop-zoom-trigger \${isZoomMenuOpen ? 'is-open' : ''}\`}
      onClick={onToggleZoomMenu}
      aria-haspopup="menu"
      aria-expanded={isZoomMenuOpen}
    >
      <span>{Math.round(zoomScale * 100)}%</span>
      <ZoomChevronIcon open={isZoomMenuOpen} color={isZoomMenuOpen ? '#0B72E7' : '#171717'} />
    </button>
    {isZoomMenuOpen ? (
      <div className="desktop-zoom-menu" role="menu" aria-label="Zoom menu">
        <div className="desktop-zoom-menu-input">{Math.round(zoomScale * 100)}%</div>
        <div className="desktop-zoom-menu-list">
          <button type="button" className="desktop-zoom-menu-item" onClick={() => onZoomPresetSelect('in')}>
            <span>Zoom in</span>
            <span>+</span>
          </button>
          <button type="button" className="desktop-zoom-menu-item" onClick={() => onZoomPresetSelect('out')}>
            <span>Zoom out</span>
            <span>-</span>
          </button>
          <button type="button" className="desktop-zoom-menu-item" onClick={() => onZoomPresetSelect('fit')}>
            <span>Zoom to fit</span>
            <span>Shift+1</span>
          </button>
          <button type="button" className="desktop-zoom-menu-item" onClick={() => onZoomPresetSelect(0.5)}>
            <span>Zoom to 50%</span>
          </button>
          <button type="button" className="desktop-zoom-menu-item" onClick={() => onZoomPresetSelect(1)}>
            <span>Zoom to 100%</span>
            <span>0</span>
          </button>
          <button type="button" className="desktop-zoom-menu-item" onClick={() => onZoomPresetSelect(1.6)}>
            <span>Zoom to 160%</span>
          </button>
        </div>
      </div>
    ) : null}
  </div>
);

export default DesktopZoomControl;
`;

fs.writeFileSync('src/components/DesktopZoomControl.jsx', codeToExtract);

let desktopAppCode = fs.readFileSync('src/pages/DesktopApp.jsx', 'utf8');

const regex = /const DesktopZoomControl = \(\{[\s\S]*?zoomScale,[\s\S]*?isZoomMenuOpen,[\s\S]*?onToggleZoomMenu,[\s\S]*?onZoomPresetSelect,[\s\S]*?\}\) => \([\s\S]*?<\/div>\r?\n\);\r?\n?/;

if (regex.test(desktopAppCode)) {
  desktopAppCode = desktopAppCode.replace(regex, '');
  
  const importStmt = "import DesktopZoomControl from '../components/DesktopZoomControl';\n";
  const importsRegex = /^import .+;$/gm;
  let lastIndex = 0;
  let m;
  while ((m = importsRegex.exec(desktopAppCode)) !== null) {
    lastIndex = m.index + m[0].length;
  }
  
  desktopAppCode = desktopAppCode.slice(0, lastIndex) + '\n' + importStmt + desktopAppCode.slice(lastIndex);
  
  fs.writeFileSync('src/pages/DesktopApp.jsx', desktopAppCode);
  console.log('Successfully extracted DesktopZoomControl.');
} else {
  console.log('Regex did not match DesktopZoomControl.');
}
