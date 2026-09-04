with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '{/* ADMIN ADD / MANAGE PRODUCTS MODAL */}' in line:
        skip = True
    
    if skip and '/>' in line and 'setIsAdminAuthenticated' in new_lines[-1] if len(new_lines)>0 else False:
        # Wait, the closing tag is just />. It spans multiple lines.
        pass

# let's just do it with content string
with open('src/App.tsx', 'r') as f:
    content = f.read()

import re
content = re.sub(r'\{/\* ADMIN ADD / MANAGE PRODUCTS MODAL \*/\}.*?/>\s*\{/\* INSTALL APP MODAL \*/\}', '{/* INSTALL APP MODAL */}', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
