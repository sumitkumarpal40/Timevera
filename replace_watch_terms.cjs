const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  for (const [regex, replacement] of Object.entries(replacements)) {
    // Regex string will be converted to RegExp object
    // Using string matching for exact strings, or RegExp for complex
    // If regex starts with '/', it's a regex, else it's a simple string replace
    if (regex.startsWith('/')) {
      const match = regex.match(new RegExp('^/(.*?)/([gimsuy]*)$'));
      if (match) {
        content = content.replace(new RegExp(match[1], match[2]), replacement);
      }
    } else {
      content = content.split(regex).join(replacement);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes made to: ${filePath}`);
  }
}

// 1. AboutSection.tsx
replaceInFile('src/components/AboutSection.tsx', {
  "About Timevera Watch": "About Timevera",
  "Timevera Watch</strong> brings stylish, affordable, and premium watches for every occasion": "Timevera</strong> brings stylish, affordable, and premium products for every occasion",
  "prestigious milestone watches, we offer timepieces": "prestigious milestone gifts, we offer products",
  "We believe a fine watch isn't just an accessory—it's a signature of confidence, punctuality, and individuality. By connecting with watch enthusiasts directly": "We believe a fine product isn't just an accessory—it's a signature of confidence and individuality. By connecting with our customers directly",
  "Every quartz movement, strap clasp, and dial is individually inspected prior to safe bubble packaging and dispatch.": "Every product and its components are individually inspected prior to safe packaging and dispatch.",
  "Watches curated for every budget starting at ₹100 up to ₹5,000 without intermediate retail markups.": "Products curated for every budget starting at ₹100 up to ₹5,000 without intermediate retail markups.",
  "WATCH": "STORE"
});

// 2. LegalPagesModal.tsx
replaceInFile('src/components/LegalPagesModal.tsx', {
  "TIMEVERA WATCH": "TIMEVERA",
  "watch ordering": "product ordering",
  "watch orders": "product orders",
  "watch images, dial colors, strap materials": "product images, colors, materials",
  "All watch orders undergo a comprehensive 10-point movement & battery quality inspection": "All product orders undergo a comprehensive quality inspection",
  "<li>Watches showing physical damage from misuse, water ingress beyond the rated ATM capacity, or unauthorized tampering/repair.</li>": "<li>Products showing physical damage from misuse, water ingress, or unauthorized tampering/repair.</li>",
  "Need assistance with your watch order?": "Need assistance with your order?",
  "watch sales": "product sales"
});

// 3. CustomerFeedbackModal.tsx
replaceInFile('src/components/CustomerFeedbackModal.tsx', {
  "Timevera Premium Watch": "Timevera Premium Product",
  "Select Watch (घड़ी चुनें):": "Select Product (उत्पाद चुनें):",
  "e.g. Great quality watch, premium look on wrist!": "e.g. Great quality product, premium look!"
});

// 4. CustomerAccountModal.tsx
replaceInFile('src/components/CustomerAccountModal.tsx', {
  "WatchProduct": "StoreProduct",
  "Watch Order": "Store Order",
  "Explore Watches (घड़ियाँ देखें)": "Explore Products (उत्पाद देखें)",
  "Reorder this watch again": "Reorder this product again",
  "TAB: WISHLIST (SAVED WATCHES)": "TAB: WISHLIST (SAVED PRODUCTS)",
  "heart icon on any watch": "heart icon on any product",
  "All past watch purchases synced to cloud": "All past purchases synced to cloud",
  "Damaged / Defective Watch Received (टूटी या खराब घड़ी)": "Damaged / Defective Product Received (टूटा या खराब उत्पाद)",
  "⚠️ Damaged / Defective Watch Received (टूटी या खराब घड़ी मिली)": "⚠️ Damaged / Defective Product Received (टूटा या खराब उत्पाद मिला)",
  "General Watch Inquiry / Other (अन्य सहायता)": "General Inquiry / Other (अन्य सहायता)",
  "❓ General Watch Inquiry / Other (अन्य कोई प्रश्न)": "❓ General Inquiry / Other (अन्य कोई प्रश्न)",
  "1 Year Movement / Machine Replacement Warranty": "1 Year Manufacturer / Replacement Warranty"
});

// 5. SupportModal.tsx
replaceInFile('src/components/SupportModal.tsx', {
  "6-Month Movement Warranty Claim": "6-Month Manufacturer Warranty Claim",
  "🛡️ 6 Months Movement Warranty Claim": "🛡️ 6 Months Manufacturer Warranty Claim",
  "Mera order kab dispatch hoga ya watch me koi issue hai...": "Mera order kab dispatch hoga ya product me koi issue hai..."
});

// 6. ProductCard.tsx
replaceInFile('src/components/ProductCard.tsx', {
  "WatchProduct": "StoreProduct",
  "Timevera Watch for just": "Timevera for just",
  "Quality tested luxury watch:": "Quality tested premium product:",
  "Share Watch Link": "Share Product Link",
  "Share Watch": "Share Product",
  "[product.movement, product.strapMaterial]": "[product.attributes?.size, product.attributes?.color]"
});

// 7. Footer.tsx
replaceInFile('src/components/Footer.tsx', {
  "TIMEVERA WATCH": "TIMEVERA"
});
