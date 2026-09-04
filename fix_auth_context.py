import re

with open("src/context/CustomerAuthContext.tsx", "r") as f:
    content = f.read()

migration_code = """          if (docSnap.exists()) {
            const data = docSnap.data() as CustomerProfile;
            
            // Address Migration
            let migrated = false;
            let currentAddresses = data.addresses || [];
            
            if (!data.addresses && (data.address || data.city || data.state || data.pincode)) {
              currentAddresses = [{
                id: 'addr_' + Date.now().toString(),
                fullName: data.fullName || '',
                phone: data.phone || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                landmark: data.landmark || '',
                isDefault: true
              }];
              data.addresses = currentAddresses;
              migrated = true;
            }

            setCustomer(data);
            
            if (migrated) {
              await setDoc(docRef, { addresses: currentAddresses }, { merge: true });
            }"""

content = content.replace("          if (docSnap.exists()) {\n            const data = docSnap.data() as CustomerProfile;\n            setCustomer(data);", migration_code)

with open("src/context/CustomerAuthContext.tsx", "w") as f:
    f.write(content)
