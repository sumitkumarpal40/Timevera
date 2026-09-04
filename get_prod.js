import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function get() {
  const d = await getDoc(doc(db, "products", "prod_1787421600792_woe5pd"));
  console.log(d.data());
  process.exit(0);
}
get();
