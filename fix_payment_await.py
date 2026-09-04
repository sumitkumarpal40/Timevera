import re

with open('src/components/PaymentModal.tsx', 'r') as f:
    content = f.read()

# Replace optimistic save with await
old_sync_pattern = r"// 1\. Instant optimistic local write.*?// 3\. Ultra-fast responsive UI feedback \(150ms\).*?await new Promise\(\(res\) => setTimeout\(\(res\), 150\)\);"

new_sync = """
    try {
      // 1. Await secure server-side transaction and rules validation
      await saveOrderToFirestore(orderData);
      
      // 2. Sync customer profile if logged in
      if (isLoggedIn && customer) {
        updateProfile({
          fullName: customerName.trim(),
          address: customerAddress.trim(),
          city: customerCity.trim(),
          pincode: customerPincode.trim(),
        }).catch((e) => console.warn('Customer profile sync error:', e));
      }
"""

content = re.sub(old_sync_pattern, new_sync, content, flags=re.DOTALL)

# Catch block for the try
content = content.replace(
    """    setPlacedOrder(orderData);
    setIsSubmitting(false);
    setIsSubmitted(true);""",
    """    setPlacedOrder(orderData);
    setIsSubmitting(false);
    setIsSubmitted(true);
    } catch (err: any) {
      console.error("Order failed:", err);
      setFormErrors({ _form: err.message || 'Failed to place order due to server validation.' });
      setIsSubmitting(false);
    }"""
)

with open('src/components/PaymentModal.tsx', 'w') as f:
    f.write(content)

