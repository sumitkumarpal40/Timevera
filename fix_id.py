import re
with open('src/types.ts', 'r') as f:
    content = f.read()

content = re.sub(r'id: string \| number;', 'id: string;', content)
with open('src/types.ts', 'w') as f:
    f.write(content)
