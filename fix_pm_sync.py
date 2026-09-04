import re

with open("src/components/PaymentModal.tsx", "r") as f:
    content = f.read()

old_sync = """      // 2. Sync customer profile if logged in
      if (isLoggedIn && customer) {
        updateProfile({
          fullName: customerName.trim(),
          address: customerAddress.trim(),
          city: customerCity.trim(),
          pincode: customerPincode.trim(),
        }).catch((e) => console.warn('Customer profile sync error:', e));
      }"""

new_sync = """      // 2. Sync customer profile if logged in
      if (isLoggedIn && customer) {
        let newAddresses = customer.addresses ? [...customer.addresses] : [];
        const isExisting = newAddresses.some(
          a => a.address.toLowerCase() === customerAddress.trim().toLowerCase() && 
               a.pincode === customerPincode.trim()
        );
        
        if (!isExisting) {
          newAddresses.push({
            id: 'addr_' + Date.now().toString(),
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            address: customerAddress.trim(),
            city: customerCity.trim(),
            state: customerCity.trim(),
            pincode: customerPincode.trim(),
            isDefault: newAddresses.length === 0,
          });
        }
        
        updateProfile({
          fullName: customerName.trim(),
          address: customerAddress.trim(), // Keep legacy fields for backward compat
          city: customerCity.trim(),
          pincode: customerPincode.trim(),
          addresses: newAddresses
        }).catch((e) => console.warn('Customer profile sync error:', e));
      }"""

content = content.replace(old_sync, new_sync)

with open("src/components/PaymentModal.tsx", "w") as f:
    f.write(content)
