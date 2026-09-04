import { WatchProduct, CategoryItem, Review } from '../types';

export const BUSINESS_INFO = {
  name: 'TIMEVERA WATCH',
  tagline: 'Time That Defines You.',
  upiId: 'sumitkumarpal40@okhdfcbank',
  email: 'timeverawatch@gmail.com',
  address: 'Village Mubarikpur, Post Surajpur, Greater Noida, Uttar Pradesh',
  priceRange: 'All Collections',
};

export const CATEGORIES_DATA: CategoryItem[] = [
  {
    id: 'budget',
    title: 'Budget Collection',
    priceRange: 'Popular Essentials',
    description: 'Everyday durable style crafted for smart value without compromising on looks.',
    iconName: 'Sparkles',
    accent: 'from-amber-900/40 to-black',
  },
  {
    id: 'style',
    title: 'Style Collection',
    priceRange: 'Modern Trend',
    description: 'Modern silhouettes, mesh straps, and polished accents for work & party.',
    iconName: 'Watch',
    accent: 'from-zinc-800/60 to-black',
  },
  {
    id: 'premium',
    title: 'Premium Collection',
    priceRange: 'Signature Series',
    description: 'Gold-finished bezels, sapphire-look crystals, and bold statement pieces.',
    iconName: 'Crown',
    accent: 'from-amber-600/30 to-black',
  },
  {
    id: 'gift',
    title: 'Gift Collection',
    priceRange: 'Special Moments',
    description: 'Exquisite packaging and couple combos perfect for birthdays & weddings.',
    iconName: 'Gift',
    accent: 'from-rose-900/30 to-black',
  },
];

export const PRODUCTS_DATA: WatchProduct[] = [];

export const REVIEWS_DATA: Review[] = [
  {
    id: 'r1',
    author: 'Rahul Sharma',
    location: 'Noida, UP',
    rating: 5,
    comment: 'Classic Black order kiya tha. Sirf 2 din me deliver ho gaya. Finishing bohot premium hai ₹499 me!',
    watchPurchased: 'Classic Black',
    date: '3 days ago',
  },
  {
    id: 'r2',
    author: 'Vikram Singh',
    location: 'Delhi NCR',
    rating: 5,
    comment: 'Premium Gold watch is unbelievable. Looks like a ₹15,000 branded watch. Great customer service and packaging.',
    watchPurchased: 'Premium Gold',
    date: '1 week ago',
  },
  {
    id: 'r3',
    author: 'Pooja Verma',
    location: 'Greater Noida',
    rating: 5,
    comment: 'Gifted the Elegant Silver to my brother on his birthday. Packaging was very neat and safe. Highly recommended!',
    watchPurchased: 'Elegant Silver',
    date: '2 weeks ago',
  },
];

export const FAQS_DATA = [
  {
    question: 'How do I place an order for a watch?',
    answer: 'Simply browse our collection, select your favorite watch, click "Order Now" or "Add to Bag", enter your delivery address at checkout, and confirm your order.',
  },
  {
    question: 'What is the price range of Timevera watches?',
    answer: 'We offer an extensive range of watches and curated portfolios spanning accessible daily essentials to luxury statement editions.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Delivery within Greater Noida, Noida & Delhi NCR takes 1-2 working days. Pan-India delivery takes 3-5 working days with safe courier tracking.',
  },
  {
    question: 'Are the watches water resistant and under warranty?',
    answer: 'Yes! All Timevera watches come with splash-proof water resistance (3 ATM / 5 ATM as listed) and a 6-month movement warranty against manufacturing defects.',
  },
  {
    question: 'Can I order multiple watches in one package?',
    answer: 'Yes! You can add multiple watches to your Shopping Bag on this website and place a combined order with a single click.',
  },
];
