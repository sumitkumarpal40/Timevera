import re
with open('src/data/watches.ts', 'r') as f:
    content = f.read()

content = content.replace("isPopular: 'true'", "isPopular: true")
with open('src/data/watches.ts', 'w') as f:
    f.write(content)
