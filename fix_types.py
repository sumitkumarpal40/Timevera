import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# Update StoreOrder status
content = re.sub(
    r"orderStatus: 'new' \| 'confirmed' \| 'packed' \| 'dispatched' \| 'delivered' \| 'cancelled';",
    "orderStatus: 'Order Received' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';",
    content
)

content = re.sub(
    r"status: 'new' \| 'confirmed' \| 'packed' \| 'dispatched' \| 'delivered' \| 'cancelled';",
    "status: 'Order Received' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';",
    content
)

# Add stock and active to WatchProduct
content = content.replace(
    "isPopular?: boolean | string;",
    "isPopular?: boolean | string;\n  stock?: number;\n  active?: boolean;"
)

with open('src/types.ts', 'w') as f:
    f.write(content)
