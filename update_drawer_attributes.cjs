const fs = require('fs');
let content = fs.readFileSync('src/components/ProductFilterDrawer.tsx', 'utf8');

const attributeSection = `

          {/* DYNAMIC ATTRIBUTES */}
          {Object.entries(availableAttributes || {}).map(([attrKey, attrValues]) => {
            if (!attrValues || attrValues.length === 0) return null;
            return (
              <div key={attrKey} className="space-y-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {attrKey}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['all', ...attrValues].map((val) => {
                    const isSelected = val === 'all' 
                      ? (!filters.attributes?.[attrKey] || filters.attributes[attrKey] === 'all')
                      : filters.attributes?.[attrKey] === val;
                    return (
                      <button
                        key={val}
                        onClick={() => {
                          const newAttributes = { ...(filters.attributes || {}) };
                          if (val === 'all') {
                            delete newAttributes[attrKey];
                          } else {
                            newAttributes[attrKey] = val;
                          }
                          onFilterChange({ attributes: newAttributes });
                        }}
                        className={\`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer \${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow'
                            : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                        }\`}
                      >
                        {val === 'all' ? \`All \${attrKey}s\` : val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* 5. CUSTOMER RATING */}`;

content = content.replace('{/* 5. CUSTOMER RATING */}', attributeSection);

fs.writeFileSync('src/components/ProductFilterDrawer.tsx', content);
