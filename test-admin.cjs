const admin = require('firebase-admin');
const { applicationDefault } = require('firebase-admin/app');
try {
  admin.initializeApp({
    credential: applicationDefault(),
    projectId: "upheld-fabric-8lcf1"
  });
  console.log("Admin SDK initialized");
} catch (e) {
  console.log("Error: " + e.message);
}
