import re

with open("src/components/CustomerAccountModal.tsx", "r") as f:
    content = f.read()

# Add the addresses tab button in the navigation bar
nav_bar_orders_btn = """              <button
                onClick={() => setAccountActiveTab('orders')}"""

addresses_btn = """              <button
                onClick={() => setAccountActiveTab('addresses')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  accountActiveTab === 'addresses'
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Addresses</span>
              </button>"""

if "setAccountActiveTab('addresses')" not in content:
    content = content.replace(nav_bar_orders_btn, addresses_btn + "\n" + nav_bar_orders_btn)

with open("src/components/CustomerAccountModal.tsx", "w") as f:
    f.write(content)
