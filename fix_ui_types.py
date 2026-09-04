import re
with open('src/components/Categories.tsx', 'r') as f:
    content = f.read()
content = content.replace("category.id)", "category.id as any)")
with open('src/components/Categories.tsx', 'w') as f:
    f.write(content)
