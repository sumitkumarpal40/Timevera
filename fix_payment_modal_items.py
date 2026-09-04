import re

with open('src/components/PaymentModal.tsx', 'r') as f:
    content = f.read()

# Fix singleProduct mapping
content = content.replace(
    "name: singleProduct.name,",
    "productId: singleProduct.id,\n          name: singleProduct.name,"
)

# Fix cartItems mapping
content = content.replace(
    "name: item.product.name,",
    "productId: item.product.id,\n          name: item.product.name,"
)

with open('src/components/PaymentModal.tsx', 'w') as f:
    f.write(content)

