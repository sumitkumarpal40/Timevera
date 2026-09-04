import re

with open("src/components/PaymentModal.tsx", "r") as f:
    content = f.read()

initial_effect = """  useEffect(() => {
    if (isOpen && customer) {
      if (customer.fullName && !customerName) setCustomerName(customer.fullName);
      if (customer.phone && !customerPhone) setCustomerPhone(customer.phone);
      if (customer.address && !customerAddress) setCustomerAddress(customer.address);
      if (customer.city && !customerCity) setCustomerCity(customer.city);
      if (customer.pincode && !customerPincode) setCustomerPincode(customer.pincode);
    }
  }, [isOpen, customer]);"""

new_effect = """  useEffect(() => {
    if (isOpen && customer) {
      // Find default address or first address
      const defaultAddr = customer.addresses?.find(a => a.isDefault) || customer.addresses?.[0];
      
      if (defaultAddr) {
        if (!customerName) setCustomerName(defaultAddr.fullName);
        if (!customerPhone) setCustomerPhone(defaultAddr.phone);
        if (!customerAddress) setCustomerAddress(defaultAddr.address);
        if (!customerCity) setCustomerCity(defaultAddr.city);
        if (!customerPincode) setCustomerPincode(defaultAddr.pincode);
      } else {
        if (customer.fullName && !customerName) setCustomerName(customer.fullName);
        if (customer.phone && !customerPhone) setCustomerPhone(customer.phone);
        if (customer.address && !customerAddress) setCustomerAddress(customer.address);
        if (customer.city && !customerCity) setCustomerCity(customer.city);
        if (customer.pincode && !customerPincode) setCustomerPincode(customer.pincode);
      }
    }
  }, [isOpen, customer]);"""

content = content.replace(initial_effect, new_effect)

with open("src/components/PaymentModal.tsx", "w") as f:
    f.write(content)
