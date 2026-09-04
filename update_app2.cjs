const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `            {filterState.minDiscount > 0 && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold">
                Min {filterState.minDiscount}% Off
              </span>
            )}
            {filterState.subcategory && filterState.subcategory !== 'all' && (
              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold capitalize">
                {filterState.subcategory}
              </span>
            )}
            {filterState.attributes && Object.entries(filterState.attributes).map(([k, v]) => (
              v && v !== 'all' && (
                <span key={k} className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded text-[11px] font-semibold capitalize">
                  {k}: {v}
                </span>
              )
            ))}`;

content = content.replace(
  /\{filterState\.minDiscount > 0 && \([\s\S]*?Min \{filterState\.minDiscount\}% Off[\s\S]*?\}[\s\S]*?\}/,
  replacement
);

fs.writeFileSync('src/App.tsx', content);
