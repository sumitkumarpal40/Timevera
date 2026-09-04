import re

with open('src/lib/orderService.ts', 'r') as f:
    content = f.read()

# Add runTransaction
if 'runTransaction' not in content:
    content = content.replace("import {", "import { runTransaction,")

# Replace saveOrderToFirestore
old_fn_pattern = r'export async function saveOrderToFirestore\(.*?\).*?Promise\.race\(\[firestoreWritePromise, timeoutPromise\]\);.*?\}'

new_fn = """export async function saveOrderToFirestore(orderData: StoreOrder): Promise<void> {
  const nowIso = new Date().toISOString();
  const orderDate = orderData.orderDate || getFormattedDateString(orderData.createdAt || nowIso);
  
  const initialHistory: OrderStatusHistoryItem[] = [
    {
      status: 'new',
      timestamp: nowIso,
      note: 'Order placed by customer',
      updatedBy: 'Customer',
    },
  ];

  const completeOrder: StoreOrder = {
    ...orderData,
    orderStatus: 'Order Received' as any,
    orderDate,
    statusHistory: initialHistory,
  };

  // Convert status to strict format requested
  if (completeOrder.orderStatus === 'new') {
    completeOrder.orderStatus = 'Order Received' as any;
  }

  // Use Firestore transaction to safely decrement stock and create order
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read product stocks for all items
      for (const item of completeOrder.items) {
        if (!item.productId) continue;
        const productRef = doc(db, 'products', item.productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error(`Product ${item.name} is no longer available.`);
        }
        
        const stock = productDoc.data().stock || 0;
        if (stock < item.quantity) {
          throw new Error(`Sorry, only ${stock} items left for ${item.name}.`);
        }
        
        // Decrement stock safely
        transaction.update(productRef, { stock: stock - item.quantity });
      }

      // 2. Create the order
      const orderRef = doc(db, ORDERS_COLLECTION, completeOrder.id);
      const cleanedData = cleanFirestoreData({
        ...completeOrder,
        createdAtFirestore: Timestamp.now(),
      });
      transaction.set(orderRef, cleanedData);
    });
    
    // Save locally for quick access
    updateLocalOrderCaches(completeOrder);
  } catch (error: any) {
    console.error("Order Transaction Failed: ", error);
    throw error;
  }
}"""

content = re.sub(old_fn_pattern, new_fn, content, flags=re.DOTALL)

with open('src/lib/orderService.ts', 'w') as f:
    f.write(content)

