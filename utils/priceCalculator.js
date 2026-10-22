// ShikshaShare Automatic Price Limit Calculator
// Evaluates resource age, condition, and maximum permissible selling price

/**
 * Calculates resource age from purchaseDate to referenceDate (defaults to today)
 * @param {string|Date} purchaseDate 
 * @param {string|Date} [referenceDate]
 * @returns {{ months: number, diffDays: number } | null}
 */
function calculateAge(purchaseDate, referenceDate = new Date()) {
  if (!purchaseDate) return null;
  const pDate = new Date(purchaseDate);
  const rDate = new Date(referenceDate);

  if (isNaN(pDate.getTime()) || isNaN(rDate.getTime())) return null;

  // Midnight comparison
  const pUtc = Date.UTC(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
  const rUtc = Date.UTC(rDate.getFullYear(), rDate.getMonth(), rDate.getDate());

  if (pUtc > rUtc) {
    return { months: -1, diffDays: -1, isFuture: true };
  }

  const diffDays = Math.floor((rUtc - pUtc) / (1000 * 60 * 60 * 24));
  
  // Month calculation with day fractional component
  const yearDiff = rDate.getFullYear() - pDate.getFullYear();
  const monthDiff = rDate.getMonth() - pDate.getMonth();
  const dayDiff = rDate.getDate() - pDate.getDate();

  let months = yearDiff * 12 + monthDiff;
  if (dayDiff < 0) {
    const prevMonthDays = new Date(rDate.getFullYear(), rDate.getMonth(), 0).getDate();
    months -= 1;
    months += (prevMonthDays + dayDiff) / prevMonthDays;
  } else {
    const curMonthDays = new Date(rDate.getFullYear(), rDate.getMonth() + 1, 0).getDate();
    months += dayDiff / curMonthDays;
  }

  return { months: Math.max(0, months), diffDays, isFuture: false };
}

/**
 * Gets age discount tier
 * 0–2 months: 95% (0.95)
 * over 2–6 months: 85% (0.85)
 * over 6–12 months: 70% (0.70)
 * over 1–2 years: 55% (0.55)
 * over 2 years: 40% (0.40)
 */
function getAgeRate(months, diffDays = null) {
  if (months === null || months === undefined || months < 0) {
    return null;
  }

  // Use both month threshold and day threshold for clean boundaries
  if (months <= 2.0 || (diffDays !== null && diffDays <= 61)) {
    return { rate: 0.95, label: '0–2 months (95%)', tier: '0-2m' };
  } else if (months <= 6.0 || (diffDays !== null && diffDays <= 183)) {
    return { rate: 0.85, label: 'Over 2–6 months (85%)', tier: '2-6m' };
  } else if (months <= 12.0 || (diffDays !== null && diffDays <= 366)) {
    return { rate: 0.70, label: 'Over 6–12 months (70%)', tier: '6-12m' };
  } else if (months <= 24.0 || (diffDays !== null && diffDays <= 732)) {
    return { rate: 0.55, label: 'Over 1–2 years (55%)', tier: '1-2y' };
  } else {
    return { rate: 0.40, label: 'Over 2 years (40%)', tier: '>2y' };
  }
}

/**
 * Gets condition multiplier
 * Like New: 100% (1.0)
 * Good: 90% (0.90)
 * Fair: 75% (0.75)
 * Poor / Damaged: Not sellable until reviewed
 */
function getConditionRate(condition) {
  const c = String(condition || '').trim().toLowerCase();
  if (c === 'like new') {
    return { rate: 1.0, allowed: true, label: 'Like New (100%)' };
  } else if (c === 'good') {
    return { rate: 0.90, allowed: true, label: 'Good (90%)' };
  } else if (c === 'fair') {
    return { rate: 0.75, allowed: true, label: 'Fair (75%)' };
  } else if (c === 'poor' || c === 'damaged' || c === 'poor/damaged' || c.includes('poor') || c.includes('damaged')) {
    return { rate: 0, allowed: false, label: 'Poor / Damaged', error: 'Poor/Damaged items cannot be sold until reviewed.' };
  }
  return { rate: 0.75, allowed: true, label: 'Fair (75%)' };
}

/**
 * Calculates maximum price for a resource
 * Formula: Maximum Price = Original Price × Age Rate × Condition Rate (round down to whole rupees)
 */
function calculateMaxPrice({ originalPrice, purchaseDate, condition, type = 'buy', referenceDate = new Date() }) {
  if (type === 'free') {
    return {
      allowed: true,
      maxPrice: 0,
      ageRate: 0,
      conditionRate: 0,
      isFree: true,
      message: 'Free donation (₹0)'
    };
  }

  const origPrice = Number(originalPrice);
  if (!origPrice || origPrice <= 0 || isNaN(origPrice)) {
    return {
      allowed: false,
      maxPrice: null,
      error: 'Valid original purchase price is required.'
    };
  }

  if (!purchaseDate) {
    return {
      allowed: false,
      maxPrice: null,
      error: 'Purchase date is required.'
    };
  }

  const ageData = calculateAge(purchaseDate, referenceDate);
  if (!ageData) {
    return {
      allowed: false,
      maxPrice: null,
      error: 'Invalid purchase date provided.'
    };
  }

  if (ageData.isFuture) {
    return {
      allowed: false,
      maxPrice: null,
      error: 'Purchase date cannot be in the future.'
    };
  }

  const ageInfo = getAgeRate(ageData.months, ageData.diffDays);
  const condInfo = getConditionRate(condition);

  if (!condInfo.allowed) {
    return {
      allowed: false,
      maxPrice: 0,
      ageInfo,
      conditionInfo: condInfo,
      error: condInfo.error || 'Poor/Damaged items cannot be sold until reviewed.'
    };
  }

  const rawMax = origPrice * ageInfo.rate * condInfo.rate;
  const maxPrice = Math.floor(rawMax);

  return {
    allowed: true,
    originalPrice: origPrice,
    purchaseDate,
    monthsAge: Math.round(ageData.months * 10) / 10,
    ageRate: ageInfo.rate,
    ageLabel: ageInfo.label,
    conditionRate: condInfo.rate,
    conditionLabel: condInfo.label,
    rawCalculatedPrice: rawMax,
    maxPrice
  };
}

module.exports = {
  calculateAge,
  getAgeRate,
  getConditionRate,
  calculateMaxPrice
};
