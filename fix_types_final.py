import re
with open('src/types.ts', 'r') as f:
    content = f.read()

# WatchProduct isPopular
content = re.sub(r'isPopular\?: boolean;', 'isPopular?: boolean | string;', content)

# Review text
content = re.sub(r'text: string;', 'text?: string;', content)

# CustomerReviewFeedback
add_crf = """  productName?: string;
  timestamp?: any;
"""
content = re.sub(r'export interface CustomerReviewFeedback \{', 'export interface CustomerReviewFeedback {\n' + add_crf, content)

# StoreOrder notes
add_so = """  notes?: string;
"""
content = re.sub(r'export interface StoreOrder \{', 'export interface StoreOrder {\n' + add_so, content)

# SupportTicket issueType
add_st = """  issueType?: string;
"""
content = re.sub(r'export interface SupportTicket \{', 'export interface SupportTicket {\n' + add_st, content)

with open('src/types.ts', 'w') as f:
    f.write(content)

