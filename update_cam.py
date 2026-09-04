import re

with open("src/components/CustomerAccountModal.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { CustomerFeedbackModal } from './CustomerFeedbackModal';",
    "import { CustomerFeedbackModal } from './CustomerFeedbackModal';\nimport { AddressBook } from './AddressBook';"
)

addresses_tab = """            {/* ========================================================================= */}
            {/* TAB: ADDRESSES                                                          */}
            {/* ========================================================================= */}
            {accountActiveTab === 'addresses' && (
              <AddressBook />
            )}"""

content = content.replace(
    "{/* TAB 2: MY PROFILE & DELIVERY ADDRESS                                     */}",
    addresses_tab + "\n\n            {/* TAB 2: MY PROFILE & DELIVERY ADDRESS                                     */}"
)

# We should also strip out the editAddress/editCity/editPincode from the profile tab so they don't get confusing, but for now just updating the label to not say "Delivery Address".
content = content.replace("Customer Profile & Delivery Address", "Customer Profile")
content = content.replace("Aapka pata yahan hamesha save rehta hai aur checkout ke waqt automatically fill ho jata hai.", "Update your personal details here.")
content = content.replace("Save Profile & Address", "Save Profile")
content = content.replace("Primary Delivery Address", "Primary Details")

with open("src/components/CustomerAccountModal.tsx", "w") as f:
    f.write(content)
