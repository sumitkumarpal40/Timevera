const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

const products = [
  {
    id: 'classic-black', name: 'Classic Black', category: 'budget', price: 499, originalPrice: 799,
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    description: 'Sleek matte midnight black finish with minimalist hour markers.', stock: 50, active: true
  },
  {
    id: 'silver-mesh', name: 'Silver Mesh', category: 'style', price: 1299, originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1587836374828-cb4387005de4?auto=format&fit=crop&w=800&q=80',
    description: 'Refined silver mesh band with a stark white dial.', stock: 30, active: true
  },
  {
    id: 'gold-prestige', name: 'Gold Prestige', category: 'premium', price: 2499, originalPrice: 3499,
    image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=800&q=80',
    description: '18k gold-plated case with chronograph functionality.', stock: 15, active: true
  },
  {
    id: 'rose-gold-elegance', name: 'Rose Gold Elegance', category: 'gift', price: 1899, originalPrice: 2499,
    image: 'https://images.unsplash.com/photo-1549972574-878950d2efb2?auto=format&fit=crop&w=800&q=80',
    description: 'A beautiful rose gold finish paired with a sunray dial.', stock: 25, active: true
  },
  {
    id: 'sapphire-chronograph', name: 'Sapphire Chronograph', category: 'premium', price: 3499, originalPrice: 4999,
    image: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=800&q=80',
    description: 'Premium chronograph watch featuring a scratch-resistant sapphire crystal.', stock: 10, active: true
  }
];

async function seed() {
  console.log("Seeding...");
  for (const p of products) {
    await setDoc(doc(db, 'products', p.id), p);
  }
  console.log("Done");
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
