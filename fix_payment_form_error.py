import re

with open('src/components/PaymentModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '              <div className="flex gap-2">',
    '''              {formErrors._form && (
                <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded-lg text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErrors._form}</span>
                </div>
              )}
              <div className="flex gap-2">'''
)

with open('src/components/PaymentModal.tsx', 'w') as f:
    f.write(content)

