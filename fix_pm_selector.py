import re

with open("src/components/PaymentModal.tsx", "r") as f:
    content = f.read()

old_banner = """                {/* Customer Account Status / Auto-fill Banner */}
                {isLoggedIn && customer ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-emerald-900 dark:text-emerald-300 text-[11px] font-semibold">
                        Logged in as <strong>{customer.fullName || 'Customer'}</strong> (+91-{customer.phone})
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Address Auto-Filled
                    </span>
                  </div>
                ) : ("""

new_banner = """                {/* Customer Account Status / Auto-fill Banner */}
                {isLoggedIn && customer ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-900 dark:text-emerald-300 text-[11px] font-semibold">
                          Logged in as <strong>{customer.fullName || 'Customer'}</strong> (+91-{customer.phone})
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                        Address Auto-Filled
                      </span>
                    </div>
                    {customer.addresses && customer.addresses.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Select from Saved Addresses:
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-white dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-red-600 focus:outline-none text-zinc-900 dark:text-white"
                          onChange={(e) => {
                            const addrId = e.target.value;
                            if (addrId) {
                              const sel = customer.addresses?.find(a => a.id === addrId);
                              if (sel) {
                                setCustomerName(sel.fullName);
                                setCustomerPhone(sel.phone);
                                setCustomerAddress(sel.address);
                                setCustomerCity(sel.city);
                                setCustomerPincode(sel.pincode);
                              }
                            } else {
                                setCustomerName('');
                                setCustomerPhone('');
                                setCustomerAddress('');
                                setCustomerCity('');
                                setCustomerPincode('');
                            }
                          }}
                        >
                          {customer.addresses.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.fullName} - {a.address}, {a.city} - {a.pincode}
                            </option>
                          ))}
                          <option value="">+ Enter New Address</option>
                        </select>
                      </div>
                    )}
                  </div>
                ) : ("""

content = content.replace(old_banner, new_banner)

with open("src/components/PaymentModal.tsx", "w") as f:
    f.write(content)
