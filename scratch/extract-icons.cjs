const fs = require('fs');
const path = require('path');

const codePath = 'src/pages/DesktopApp.jsx';
let code = fs.readFileSync(codePath, 'utf8');

const regex = /const ([A-Z][a-zA-Z0-9]+) = \([^)]*\) => \(\s*<svg[\s\S]*?<\/svg>\s*\);/g;

let match;
let iconsCode = "import React from 'react';\n\n";
const iconNames = [];

while ((match = regex.exec(code)) !== null) {
  iconNames.push(match[1]);
  iconsCode += match[0].replace(/^const /, 'export const ') + '\n\n';
}

console.log('Found icons:', iconNames.length);
if (iconNames.length > 0) {
  for (const name of iconNames) {
    const removeRegex = new RegExp(`const ${name} = \\([^)]*\\) => \\(\\s*<svg[\\s\\S]*?<\\/svg>\\s*\\);\\n*\\n*`);
    code = code.replace(removeRegex, '');
  }

  const importStmt = `import { ${iconNames.join(', ')} } from '../components/icons/AppIcons';\n`;
  const lastImportIndex = code.lastIndexOf('import ');
  const endOfLastImport = code.indexOf('\n', lastImportIndex) + 1;
  code = code.slice(0, endOfLastImport) + importStmt + code.slice(endOfLastImport);

  const iconDir = path.dirname('src/components/icons/AppIcons.jsx');
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  fs.writeFileSync('src/components/icons/AppIcons.jsx', iconsCode);
  fs.writeFileSync(codePath, code);
  console.log('Successfully extracted icons.');
}
