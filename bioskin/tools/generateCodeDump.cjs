// tools/generateCodeDump.cjs
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src');

function readFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      readFiles(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.css') || entry.name.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      console.log(`\n--- FILE: ${path.relative('.', fullPath)} ---\n`);
      console.log(content);
    }
  });
}

readFiles(dir);
