const fs = require('fs');

const globalStylesCode = `import React, { useEffect } from 'react';

const GlobalStyles = ({ appearance }) => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    const shellBackground = appearance === 'dark' ? '#121212' : '#ffffff';
    style.textContent = \`
      * { box-sizing: border-box; }
      html, body, #root { margin: 0; min-height: 100%; background: \${shellBackground}; }
      body { overflow: hidden; }
      button, input { font: inherit; }
      ::selection { background-color: #ef4444; color: white; }
    \`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, [appearance]);
  return null;
};

export default GlobalStyles;
`;

fs.writeFileSync('src/components/GlobalStyles.jsx', globalStylesCode);

let desktopAppCode = fs.readFileSync('src/pages/DesktopApp.jsx', 'utf8');

const regex = /const GlobalStyles = \(\{ appearance \}\) => \{[\s\S]*?return null;\n\};\n*/;
desktopAppCode = desktopAppCode.replace(regex, '');

const importStmt = "import GlobalStyles from '../components/GlobalStyles';\n";
const lastImportIndex = desktopAppCode.lastIndexOf('import ');
const endOfLastImport = desktopAppCode.indexOf('\n', lastImportIndex) + 1;
desktopAppCode = desktopAppCode.slice(0, endOfLastImport) + importStmt + desktopAppCode.slice(endOfLastImport);

fs.writeFileSync('src/pages/DesktopApp.jsx', desktopAppCode);
console.log('Successfully extracted GlobalStyles.');
