with open('src/components/PaymentModal.tsx', 'r') as f:
    content = f.read()

import re
content = re.sub(r"\}\s*catch\s*\(err:\s*any\)\s*\{\s*console\.error\(\"Order\s*failed:\",\s*err\);\s*setFormErrors\(\{\s*_form:\s*err\.message\s*\|\|\s*'Failed\s*to\s*place\s*order\s*due\s*to\s*server\s*validation\.'\s*\}\);\s*setIsSubmitting\(false\);\s*\}\s*\}\s*catch\s*\(err:\s*any\)\s*\{\s*console\.error\(\"Order\s*failed:\",\s*err\);\s*setFormErrors\(\{\s*_form:\s*err\.message\s*\|\|\s*'Failed\s*to\s*place\s*order\s*due\s*to\s*server\s*validation\.'\s*\}\);\s*setIsSubmitting\(false\);\s*\}", """} catch (err: any) {
      console.error("Order failed:", err);
      setFormErrors({ _form: err.message || 'Failed to place order due to server validation.' });
      setIsSubmitting(false);
      return;
    }""", content)

with open('src/components/PaymentModal.tsx', 'w') as f:
    f.write(content)
