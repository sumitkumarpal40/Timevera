const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const useMemoIndex = content.indexOf('const filteredProducts = useMemo');
const insertionPoint = content.lastIndexOf('\n', useMemoIndex);

console.log(content.substring(insertionPoint - 200, insertionPoint + 200));
