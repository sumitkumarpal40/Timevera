import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  console.log("Checking DB ID:", config.firestoreDatabaseId);
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    console.log("Total products found in new DB:", querySnapshot.size);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data().name || doc.data().title);
    });
  } catch (err) {
    console.error("Error reading new DB:", err);
  }
  process.exit(0);
}
check();
