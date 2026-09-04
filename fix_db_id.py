import re
with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

# Replace the db initialization
content = re.sub(
    r'export const db = initializeFirestore\(.*?\);',
    'export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");',
    content
)

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)

