// tools/generateDirectoryTree.cjs
const fs = require('fs');
const path = require('path');

function printTree(dirPath, prefix = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const fullPath = path.join(dirPath, entry.name);

    console.log(prefix + connector + entry.name);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      printTree(fullPath, newPrefix);
    }
  });
}

const projectRoot = path.join(__dirname, '..'); // Root of project
console.log(path.basename(projectRoot));
printTree(projectRoot);
