import re

with open('src/components/PaymentModal.tsx', 'r') as f:
    content = f.read()

# Replace block from "// 1. Instant optimistic local write" up to "setIsSubmitted(true);"
old_block_pattern = r"// 1\. Instant optimistic local write.*?setIsSubmitted\(true\);"

new_block = """
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
      
      setPlacedOrder(orderData);
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Order failed:", err);
      setFormErrors({ _form: err.message || 'Failed to place order due to server validation.' });
      setIsSubmitting(false);
    }
"""

content = re.sub(old_block_pattern, new_block, content, flags=re.DOTALL)

with open('src/components/PaymentModal.tsx', 'w') as f:
    f.write(content)

