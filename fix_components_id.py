import re

files = [
    'src/components/ContactSection.tsx',
    'src/components/CustomerAccountModal.tsx',
    'src/components/SupportModal.tsx',
    'src/components/PaymentModal.tsx'
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # Find occurrences where we do id: Math.floor(...) or something that assigns number to id
    content = re.sub(r'id:\s*(Math\.floor\([^)]+\))', r'id: \1.toString()', content)
    content = re.sub(r'id:\s*(Date\.now\(\))', r'id: \1.toString()', content)

    with open(file_path, 'w') as f:
        f.write(content)

