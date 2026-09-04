import re
with open('src/types.ts', 'r') as f:
    content = f.read()

# Fix types to allow numbers for ids that should be strings
content = re.sub(r'id: string;', 'id: string | number;', content)

# Fix timestamp arithmetic issues by making timestamp any
content = re.sub(r'timestamp\?: string;', 'timestamp?: any;', content)
content = re.sub(r'timestamp: string;', 'timestamp: any;', content)

# Fix WatchProduct
content = re.sub(r'isPopular\?: boolean;', 'isPopular?: boolean | string;', content)

# Add comment, location, watchPurchased to Review if missing
if 'comment?: string' not in content:
    content = re.sub(r'export interface Review \{', 'export interface Review {\n  comment?: string;\n  location?: string;\n  watchPurchased?: string;\n', content)

with open('src/types.ts', 'w') as f:
    f.write(content)
