with open('src/lib/orderService.ts', 'r') as f:
    content = f.read()

content = content.replace("import { runTransaction, db } from './firebase';", "import { db } from './firebase';")
content = content.replace("import { runTransaction, StoreOrder,", "import { StoreOrder,")

with open('src/lib/orderService.ts', 'w') as f:
    f.write(content)
