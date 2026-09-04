const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The file ends at `export default function App() { ... }` that is duplicated.
// Let's find the FIRST export default function App() and cut everything after it.
const firstExportIndex = content.indexOf('export default function App() {');
if (firstExportIndex !== -1) {
  let cutContent = content.substring(0, firstExportIndex);
  cutContent += `export default function App() {
  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <TimeveraStore />
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
`;
  fs.writeFileSync('src/App.tsx', cutContent);
}
