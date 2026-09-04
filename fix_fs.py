import re
with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

content = re.sub(r'export const db = initializeFirestore\(app, \{ experimentalForceLongPolling: true \}\);',
                 'export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true, experimentalForceLongPolling: true });',
                 content)

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
