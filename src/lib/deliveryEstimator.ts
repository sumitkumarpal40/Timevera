/**
 * Delivery Estimator Service for TIMEVERA WATCH
 * Provides zone-based transit time estimates across Indian Postal Codes (PIN codes)
 * Dispatch origin: Greater Noida Hub (UP - 201306)
 */

export interface DeliveryEstimate {
  valid: boolean;
  pincode: string;
  isServiceable: boolean;
  zone: string;
  locationHint?: string;
  minDays: number;
  maxDays: number;
  estimateText: string;
  message: string;
  disclaimer: string;
}

/**
 * Validate 6-digit Indian PIN code format
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Calculate estimated transit days based on destination postal code
 */
export function getDeliveryEstimate(pincodeInput: string): DeliveryEstimate {
  const clean = pincodeInput.replace(/\D/g, '').trim();

  if (!clean) {
    return {
      valid: false,
      pincode: '',
      isServiceable: false,
      zone: 'Unknown',
      minDays: 0,
      maxDays: 0,
      estimateText: '',
      message: 'Please enter your 6-digit delivery pincode.',
      disclaimer: '',
    };
  }

  if (clean.length !== 6 || !/^[1-9][0-9]{5}$/.test(clean)) {
    return {
      valid: false,
      pincode: clean,
      isServiceable: false,
      zone: 'Invalid',
      minDays: 0,
      maxDays: 0,
      estimateText: '',
      message: 'Invalid pincode. Please enter a valid 6-digit Indian postal code.',
      disclaimer: '',
    };
  }

  const prefix2 = parseInt(clean.substring(0, 2), 10);
  const prefix3 = parseInt(clean.substring(0, 3), 10);

  let zone = 'National';
  let locationHint = 'India';
  let minDays = 3;
  let maxDays = 5;

  // Local / Origin Hub: Greater Noida / Noida / Ghaziabad (201xxx) & Delhi (110xxx)
  if (prefix3 >= 201 && prefix3 <= 203) {
    zone = 'Local / NCR';
    locationHint = 'Delhi-NCR / West UP';
    minDays = 1;
    maxDays = 2;
  } else if (prefix2 === 11) {
    zone = 'Delhi Metro';
    locationHint = 'Delhi NCR';
    minDays = 1;
    maxDays = 2;
  } else if (prefix2 === 12 || prefix2 === 13) {
    zone = 'Haryana';
    locationHint = 'Gurugram / Faridabad / Haryana';
    minDays = 2;
    maxDays = 3;
  } else if (prefix2 === 14 || prefix2 === 15 || prefix2 === 16) {
    zone = 'North India';
    locationHint = 'Punjab / Chandigarh';
    minDays = 2;
    maxDays = 4;
  } else if (prefix2 === 17 || prefix2 === 18 || prefix2 === 19) {
    zone = 'North Hills';
    locationHint = 'Himachal / J&K / Uttarakhand';
    minDays = 3;
    maxDays = 6;
  } else if (prefix2 >= 20 && prefix2 <= 28) {
    zone = 'Uttar Pradesh';
    locationHint = 'Uttar Pradesh Region';
    minDays = 2;
    maxDays = 3;
  } else if (prefix2 >= 30 && prefix2 <= 34) {
    zone = 'Rajasthan';
    locationHint = 'Rajasthan Region';
    minDays = 2;
    maxDays = 4;
  } else if (prefix2 >= 36 && prefix2 <= 39) {
    zone = 'Gujarat';
    locationHint = 'Gujarat Region';
    minDays = 2;
    maxDays = 4;
  } else if (prefix2 >= 40 && prefix2 <= 44) {
    zone = 'Maharashtra / Goa';
    locationHint = 'Mumbai / Pune / Maharashtra';
    minDays = 2;
    maxDays = 4;
  } else if (prefix2 >= 45 && prefix2 <= 49) {
    zone = 'Central India';
    locationHint = 'Madhya Pradesh / Chhattisgarh';
    minDays = 3;
    maxDays = 5;
  } else if (prefix2 >= 50 && prefix2 <= 53) {
    zone = 'Telangana & AP';
    locationHint = 'Hyderabad / Andhra Pradesh';
    minDays = 3;
    maxDays = 5;
  } else if (prefix2 >= 56 && prefix2 <= 59) {
    zone = 'Karnataka';
    locationHint = 'Bengaluru / Karnataka';
    minDays = 3;
    maxDays = 5;
  } else if (prefix2 >= 60 && prefix2 <= 64) {
    zone = 'Tamil Nadu';
    locationHint = 'Chennai / Tamil Nadu';
    minDays = 3;
    maxDays = 5;
  } else if (prefix2 >= 67 && prefix2 <= 69) {
    zone = 'Kerala';
    locationHint = 'Kochi / Kerala';
    minDays = 3;
    maxDays = 5;
  } else if (prefix2 >= 70 && prefix2 <= 74) {
    zone = 'East India';
    locationHint = 'Kolkata / West Bengal';
    minDays = 3;
    maxDays = 5;
  } else if (prefix2 >= 75 && prefix2 <= 77) {
    zone = 'Odisha';
    locationHint = 'Bhubaneswar / Odisha';
    minDays = 3;
    maxDays = 5;
  } else if (prefix2 >= 78 && prefix2 <= 79) {
    zone = 'North East';
    locationHint = 'Assam / North East';
    minDays = 4;
    maxDays = 7;
  } else if (prefix2 >= 80 && prefix2 <= 85) {
    zone = 'Bihar & Jharkhand';
    locationHint = 'Patna / Ranchi / Bihar';
    minDays = 3;
    maxDays = 5;
  }

  const estimateText = `${minDays}–${maxDays} business days`;
  const message = `Serviceable: Estimated delivery in ${estimateText} to ${locationHint} (${clean}).`;
  const disclaimer = 'Estimated range based on standard courier transit from our Greater Noida hub. Actual delivery times may vary based on local logistics.';

  return {
    valid: true,
    pincode: clean,
    isServiceable: true,
    zone,
    locationHint,
    minDays,
    maxDays,
    estimateText,
    message,
    disclaimer,
  };
}
