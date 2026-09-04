import re
with open('src/components/Categories.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'activeCategory === item\.id \? \'text-white\' : \'text-zinc-400 group-hover:text-zinc-300\'', 'activeCategory === (item.id as string) ? \'text-white\' : \'text-zinc-400 group-hover:text-zinc-300\'', content)

# just make it activeCategory: any;
content = re.sub(r'activeCategory: "style" \| "gift" \| "budget" \| "premium" \| "all" \| string;', 'activeCategory: any;', content)
with open('src/components/Categories.tsx', 'w') as f:
    f.write(content)
