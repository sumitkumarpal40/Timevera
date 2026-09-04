with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace("orderStatus: 'Order Received' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned' | string;", "orderStatus: 'Order Received' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';")

with open('src/types.ts', 'w') as f:
    f.write(content)
