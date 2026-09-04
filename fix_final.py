import re
with open('src/types.ts', 'r') as f:
    content = f.read()

# Fix issueType duplication
content = re.sub(r'  issueType\?: string;\n', '', content)

# WatchProduct isPopular
content = re.sub(r'isPopular\?: boolean \| string;', 'isPopular?: any;', content)

# CustomerReviewFeedback title
add_crf = """  title?: string;
"""
content = re.sub(r'export interface CustomerReviewFeedback \{', 'export interface CustomerReviewFeedback {\n' + add_crf, content)

# StoreOrder paymentStatus
# PaymentModal expects to not provide paymentStatus initially, so let's make it optional.
content = re.sub(r'paymentStatus: \'pending\' \| \'verified\' \| \'failed\' \| \'refunded\';', 'paymentStatus?: \'pending\' | \'verified\' | \'failed\' | \'refunded\';', content)

with open('src/types.ts', 'w') as f:
    f.write(content)

with open('src/components/Categories.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'activeCategory: string;', 'activeCategory: "style" | "gift" | "budget" | "premium" | "all" | string;', content)

with open('src/components/Categories.tsx', 'w') as f:
    f.write(content)

