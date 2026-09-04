import React, { useState } from 'react';
import { Plus, Edit3, Trash2, MapPin, CheckCircle, Save, X } from 'lucide-react';
import { CustomerAddress } from '../types';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const AddressBook: React.FC = () => {
  const { customer, updateProfile } = useCustomerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CustomerAddress>>({});

  if (!customer) return null;

  const addresses = customer.addresses || [];

  const handleAddNew = () => {
    setEditId(null);
    setFormData({
      fullName: customer.fullName || '',
      phone: customer.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: addresses.length === 0,
    });
    setIsEditing(true);
  };

  const handleEdit = (addr: CustomerAddress) => {
    setEditId(addr.id);
    setFormData(addr);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    const newAddresses = addresses.filter(a => a.id !== id);
    if (newAddresses.length > 0 && !newAddresses.some(a => a.isDefault)) {
      newAddresses[0].isDefault = true;
    }
    await updateProfile({ addresses: newAddresses });
  };

  const handleSetDefault = async (id: string) => {
    const newAddresses = addresses.map(a => ({
      ...a,
      isDefault: a.id === id,
    }));
    await updateProfile({ addresses: newAddresses });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.pincode) return;

    let newAddresses = [...addresses];

    if (formData.isDefault) {
      newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
    }

    if (editId) {
      const idx = newAddresses.findIndex(a => a.id === editId);
      if (idx !== -1) {
        newAddresses[idx] = { ...newAddresses[idx], ...formData } as CustomerAddress;
      }
    } else {
      const newAddr: CustomerAddress = {
        ...formData as CustomerAddress,
        id: 'addr_' + Date.now().toString(),
      };
      newAddresses.push(newAddr);
    }

    if (newAddresses.length > 0 && !newAddresses.some(a => a.isDefault)) {
      newAddresses[0].isDefault = true;
    }

    await updateProfile({ addresses: newAddresses });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4 max-w-xl mx-auto p-4 bg-zinc-50 dark:bg-[#1a0d0d] rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
            {editId ? 'Edit Address' : 'Add New Address'}
          </h4>
          <button type="button" onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
            <input type="text" required value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Mobile Number *</label>
            <input type="text" required value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Complete Address *</label>
          <textarea required rows={3} value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">City / District *</label>
            <input type="text" required value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">State *</label>
            <input type="text" required value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Pincode *</label>
            <input type="text" required maxLength={6} value={formData.pincode || ''} onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Landmark (Optional)</label>
            <input type="text" value={formData.landmark || ''} onChange={e => setFormData({ ...formData, landmark: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={formData.isDefault || false} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded border-zinc-300 text-red-600 focus:ring-red-600" />
          Set as Default Address
        </label>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Save className="w-4 h-4" /> Save Address
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h4 className="text-sm font-extrabold uppercase text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-600" />
          <span>My Saved Addresses ({addresses.length})</span>
        </h4>
        <button onClick={handleAddNew} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 bg-zinc-50 dark:bg-[#1a0d0d] rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <MapPin className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-zinc-500 mb-3">No saved addresses found.</p>
          <button onClick={handleAddNew} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer">
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`p-4 rounded-2xl border ${addr.isDefault ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#181818]'} space-y-2`}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                    {addr.fullName}
                    {addr.isDefault && (
                      <span className="text-[9px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-black uppercase">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{addr.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(addr)} className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <p>{addr.address}</p>
                <p>{addr.landmark && `${addr.landmark}, `}{addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span></p>
              </div>
              {!addr.isDefault && (
                <button onClick={() => handleSetDefault(addr.id)} className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wide cursor-pointer flex items-center gap-1 pt-1">
                  <CheckCircle className="w-3 h-3" /> Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
