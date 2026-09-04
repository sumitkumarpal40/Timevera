import { Coupon } from '../types';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

/**
 * Pre-configured active store coupons for Timevera Watch
 * Owner/Admin can also manage coupons dynamically from Firestore /coupons collection
 */
export const STORE_COUPONS: Coupon[] = [
  {
    code: 'TIMEVERA100',
    description: 'Flat ₹100 OFF on orders of ₹499 or more',
    discountType: 'fixed',
    discountValue: 100,
    minOrderValue: 499,
    active: true,
  },
  {
    code: 'WELCOME10',
    description: '10% Instant OFF on your order (Up to ₹300)',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 299,
    maxDiscountAmount: 300,
    active: true,
  },
  {
    code: 'STYLE200',
    description: 'Flat ₹200 OFF on Style & Premium watches (Min order ₹999)',
    discountType: 'fixed',
    discountValue: 200,
    minOrderValue: 999,
    active: true,
  },
  {
    code: 'PREMIUM500',
    description: 'Special ₹500 OFF on Premium Collections (Min order ₹2,499)',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 2499,
    active: true,
  },
];

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountAmount: number;
  subtotal: number;
  finalTotal: number;
  message: string;
  coupon?: Coupon;
}

/**
 * Secure calculation of coupon discount on subtotal
 */
export function calculateCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (subtotal < coupon.minOrderValue) {
    return 0;
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    discount = Math.round(coupon.discountValue);
  }

  // Prevent discount from exceeding subtotal
  return Math.min(discount, subtotal);
}

/**
 * Validates a coupon against current order subtotal and active rules
 */
export async function validateCoupon(
  enteredCode: string,
  subtotal: number,
  customerUid?: string
): Promise<CouponValidationResult> {
  const cleanCode = enteredCode.trim().toUpperCase();

  if (!cleanCode) {
    return {
      valid: false,
      code: '',
      discountAmount: 0,
      subtotal,
      finalTotal: subtotal,
      message: 'Please enter a coupon code.',
    };
  }

  // 1. Check in Firestore for dynamic admin coupons
  let foundCoupon: Coupon | undefined;
  try {
    const couponRef = doc(db, 'coupons', cleanCode);
    const snap = await getDoc(couponRef);
    if (snap.exists()) {
      const data = snap.data() as Coupon;
      if (data.active !== false) {
        foundCoupon = { ...data, code: cleanCode };
      }
    }
  } catch (err) {
    // Firestore offline fallback to built-in coupons
  }

  // 2. Check in pre-configured active store coupons if not in Firestore
  if (!foundCoupon) {
    foundCoupon = STORE_COUPONS.find(
      (c) => c.code.toUpperCase() === cleanCode && c.active
    );
  }

  if (!foundCoupon) {
    return {
      valid: false,
      code: cleanCode,
      discountAmount: 0,
      subtotal,
      finalTotal: subtotal,
      message: `Coupon "${cleanCode}" is invalid or expired.`,
    };
  }

  // Check validity dates if present
  if (foundCoupon.validUntil) {
    const expiry = new Date(foundCoupon.validUntil).getTime();
    if (Date.now() > expiry) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        subtotal,
        finalTotal: subtotal,
        message: `Coupon "${cleanCode}" has expired.`,
      };
    }
  }

  // Check minimum order value
  if (subtotal < foundCoupon.minOrderValue) {
    return {
      valid: false,
      code: cleanCode,
      discountAmount: 0,
      subtotal,
      finalTotal: subtotal,
      message: `Minimum order value of ₹${foundCoupon.minOrderValue.toLocaleString('en-IN')} required for "${cleanCode}". Add ₹${(foundCoupon.minOrderValue - subtotal).toLocaleString('en-IN')} more to bag.`,
      coupon: foundCoupon,
    };
  }

  const discountAmount = calculateCouponDiscount(foundCoupon, subtotal);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    valid: true,
    code: cleanCode,
    discountAmount,
    subtotal,
    finalTotal,
    message: `Coupon "${cleanCode}" applied successfully! You saved ₹${discountAmount.toLocaleString('en-IN')}.`,
    coupon: foundCoupon,
  };
}
