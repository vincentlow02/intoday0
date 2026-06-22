const fs = require('fs');

const glob = fs.readdirSync('src/components').filter(f => f.endsWith('.jsx'));
glob.push('../pages/DesktopApp.jsx');

const css = fs.readFileSync('src/styles/timeline.css', 'utf8');
const selectors = new Set();
const regex = /([\.#a-zA-Z0-9_\-\s:,]+)\s*\{/g;
let match;
while ((match = regex.exec(css)) !== null) {
  let selectorGroup = match[1].trim();
  if (!selectorGroup.startsWith('@')) {
    selectorGroup.split(',').forEach(sel => {
      let cleanSel = sel.trim().split(':')[0].trim();
      let lastClass = cleanSel.split(' ').pop();
      if (lastClass.startsWith('.')) {
        selectors.add(lastClass.substring(1));
      }
    });
  }
}

console.log('--- CSS Classes from timeline.css Found in Desktop Code ---');
for (const file of glob) {
  const filePath = file.startsWith('..') ? 'src/' + file.substring(3) : 'src/components/' + file;
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const sel of selectors) {
    if (content.includes(sel)) {
      console.log(`${sel} -> ${filePath}`);
    }
  }
}
