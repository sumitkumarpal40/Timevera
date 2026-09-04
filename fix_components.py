import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace("'new'", "'Order Received'")
    content = content.replace("case 'Order Received':", "case 'Order Received':")
    content = content.replace("'confirmed'", "'Confirmed'")
    content = content.replace("'packed'", "'Packed'")
    content = content.replace("'dispatched'", "'Shipped'")
    content = content.replace("'delivered'", "'Delivered'")
    content = content.replace("'cancelled'", "'Cancelled'")
    with open(filepath, 'w') as f:
        f.write(content)

fix_file('src/components/CustomerAccountModal.tsx')
fix_file('src/components/PaymentModal.tsx')
fix_file('src/components/OrderTrackModal.tsx')
fix_file('src/lib/orderService.ts')
