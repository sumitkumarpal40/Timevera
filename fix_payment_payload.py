import re

with open('src/components/PaymentModal.tsx', 'r') as f:
    content = f.read()

# Replace orderData creation
old_payload_pattern = r"const orderData: StoreOrder = \{.*?notes: paymentMethod === 'upi' \? 'PREPAID ORDER \(Online UPI\)' : 'CASH ON DELIVERY \(COD\)',\s*\};"

new_payload = """
    const firstItem = items[0];
    const deliveryCharge = 0;
    const discount = 0;
    const productPrice = firstItem.price;
    const finalAmount = totalAmount + deliveryCharge - discount;
    const isOnline = paymentMethod === 'upi';

    const orderData: StoreOrder = {
      id: orderId,
      customerUid: customer?.uid,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customer?.email || '',
      customerAddress: customerAddress.trim(),
      customerCity: customerCity.trim(),
      customerPincode: customerPincode.trim(),
      
      // Strict required fields
      productId: firstItem.productId,
      productName: firstItem.name,
      productImage: firstItem.image,
      quantity: firstItem.quantity,
      productPrice: productPrice,
      discount: discount,
      deliveryCharge: deliveryCharge,
      finalAmount: finalAmount,
      totalAmount: finalAmount,
      
      paymentMethod: isOnline ? 'Online' : 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Order Received',
      
      createdAt: now,
      orderDate: now.split('T')[0],
      items: items, // keep for backward compat
      notes: isOnline ? 'PREPAID ORDER (Online)' : 'CASH ON DELIVERY (COD)',
    };
"""

content = re.sub(old_payload_pattern, new_payload, content, flags=re.DOTALL)

with open('src/components/PaymentModal.tsx', 'w') as f:
    f.write(content)

