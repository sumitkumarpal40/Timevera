const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const filterIndex = content.indexOf('// Filter & Sort Logic');
const insertionPoint = content.lastIndexOf('  const activeFilterCount', filterIndex);

console.log(content.substring(insertionPoint - 200, insertionPoint + 100));
