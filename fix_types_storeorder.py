with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace("paymentMethod: 'cod' | 'upi_qr';", "paymentMethod: 'COD' | 'Online' | 'cod' | 'upi_qr';")
content = content.replace("paymentStatus?: 'pending' | 'verified' | 'failed' | 'refunded';", "paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'pending' | 'verified' | 'failed' | 'refunded';")

with open('src/types.ts', 'w') as f:
    f.write(content)
