import re
with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");',
    """let dbInstance;
try {
  dbInstance = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = dbInstance;"""
)

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
