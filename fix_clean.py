import re

# Fix Watches isPopular
with open('src/types.ts', 'r') as f:
    content = f.read()
content = re.sub(r'isPopular\?: boolean;', 'isPopular?: boolean | string;', content)
content = re.sub(r'isPopular\?: any;', 'isPopular?: boolean | string;', content)
if 'comment?: string' not in content:
    content = re.sub(r'export interface CustomerReviewFeedback \{', 'export interface CustomerReviewFeedback {\n  comment?: string;\n', content)
with open('src/types.ts', 'w') as f:
    f.write(content)

# Fix issueType
for fp in ['src/components/ContactSection.tsx', 'src/components/CustomerAccountModal.tsx', 'src/components/SupportModal.tsx']:
    with open(fp, 'r') as f:
        content = f.read()
    content = re.sub(r'issueCategory:', 'issueType:', content)
    with open(fp, 'w') as f:
        f.write(content)

