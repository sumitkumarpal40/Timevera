import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix footer
content = re.sub(
    r'<Footer\s*onOpenAdmin=\{\(\) => \{\}\} else \{\s*setIsAdminOpen\(true\);\s*\}\s*\}\}\s*onOpenInstallApp=\{\(\) => setIsInstallAppOpen\(true\)\}\s*/>',
    '<Footer onOpenAdmin={() => {}} onOpenInstallApp={() => setIsInstallAppOpen(true)} />',
    content,
    flags=re.DOTALL
)

# Remove AdminProductModal
content = re.sub(r'\{/\* ADMIN ADD / MANAGE PRODUCTS MODAL \*/\}(.*?)</AdminProductModal>', '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
