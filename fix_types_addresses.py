import re

with open("src/types.ts", "r") as f:
    content = f.read()

# Add CustomerAddress interface
addr_interface = """
export interface CustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface CustomerProfile"""

content = content.replace("export interface CustomerProfile", addr_interface)

# Add addresses to CustomerProfile
content = content.replace(
    "  wishlist?: string[]; // Array of WatchProduct IDs",
    "  wishlist?: string[]; // Array of WatchProduct IDs\n  addresses?: CustomerAddress[];"
)

with open("src/types.ts", "w") as f:
    f.write(content)
