import re
with open('src/types.ts', 'r') as f:
    content = f.read()

# Fix CategoryItem - missing properties in my rewrite?
# Original probably had more.
# Fix Review - missing comment, location, watchPurchased
add_structs = """
export interface CategoryItem {
  id: string;
  title: string;
  priceRange: string;
  description: string;
  iconName: string;
  accent: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  comment?: string;
  location?: string;
  watchPurchased?: string;
}
"""
content = re.sub(r'export interface CategoryItem \{.*?(?=export interface CustomerReviewFeedback \{)', add_structs, content, flags=re.DOTALL)

# Fix CustomerReviewFeedback orderId
content = re.sub(r'export interface CustomerReviewFeedback \{', 'export interface CustomerReviewFeedback {\n  orderId?: string;\n', content)

with open('src/types.ts', 'w') as f:
    f.write(content)
