import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

idx = content.find('export default function App() {')
if idx != -1:
    content = content[:idx] + """export default function App() {
  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <TimeveraStore />
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
"""
    with open('src/App.tsx', 'w') as f:
        f.write(content)
