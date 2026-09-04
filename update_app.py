import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add firestore imports
content = content.replace("import { WatchProduct, CartItem } from './types';", 
"import { WatchProduct, CartItem } from './types';\nimport { collection, onSnapshot, query, where } from 'firebase/firestore';\nimport { db } from './lib/firebase';")

# Replace products state
old_products_state = """  // Products state persisted in localStorage
  const [products, setProducts] = useState<WatchProduct[]>(() => {
    try {
      const saved = localStorage.getItem('timevera_products');
      return saved ? JSON.parse(saved) : PRODUCTS_DATA;
    } catch {
      return PRODUCTS_DATA;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('timevera_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);"""

new_products_state = """  // Real-time products from Firestore
  const [products, setProducts] = useState<WatchProduct[]>(PRODUCTS_DATA);
  
  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: WatchProduct[] = [];
      snapshot.forEach(doc => {
        prods.push({ id: doc.id, ...doc.data() } as WatchProduct);
      });
      if (prods.length > 0) {
        setProducts(prods);
      }
    }, (error) => {
      console.error("Error fetching products:", error);
    });
    return () => unsubscribe();
  }, []);"""

content = content.replace(old_products_state, new_products_state)

with open('src/App.tsx', 'w') as f:
    f.write(content)
