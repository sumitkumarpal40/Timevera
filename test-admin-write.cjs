const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { applicationDefault } = require('firebase-admin/app');
const app = admin.initializeApp({
  credential: applicationDefault(),
  projectId: "upheld-fabric-8lcf1"
});
const db = getFirestore(app);
db.settings({ databaseId: 'ai-studio-timeverawatch-1d272a04-794e-44a1-8b30-546773333f61' });
db.collection('test').doc('admin_test').set({ works: true }).then(() => {
  console.log("Write Success");
  process.exit(0);
}).catch(e => {
  console.log("Write Error: " + e.message);
  process.exit(1);
});
