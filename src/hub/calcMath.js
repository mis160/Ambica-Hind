// Formulas for the Tools page. Kept separate so they are easy to check.
// Every function returns NaN where an input is missing, and the screen shows "—" for NaN.

// Plain steel wire: kg per metre = (pi/4) x d^2 (mm^2) x 7850 kg/m3 / 1,000,000  (about 0.0061654 x d^2)
export const STEEL_KG_PER_MM2_PER_M = ((Math.PI / 4) * 7850) / 1e6;

export function quantityAmount(qty, unit, ratePerKg) {
  const kg = unit === 'MT' ? qty * 1000 : qty;
  const amount = kg * ratePerKg;
  return { kg, mt: kg / 1000, amount, lakh: amount / 100000 };
}

export function gst(amount, ratePct, mode) {
  const r = ratePct / 100;
  let base;
  let tax;
  let total;
  if (mode === 'remove') {
    total = amount;
    base = total / (1 + r);
    tax = total - base;
  } else {
    base = amount;
    tax = base * r;
    total = base + tax;
  }
  return { base, tax, half: tax / 2, total };
}

export function wireWeight(diaMm, lengthM) {
  const perMetre = STEEL_KG_PER_MM2_PER_M * diaMm * diaMm;
  return {
    perMetre,
    per1000m: perMetre * 1000,
    metresPerMT: 1000 / perMetre,
    forLength: perMetre * lengthM
  };
}

// Zinc needed to coat galvanised wire.
// Surface area of 1 m of wire = pi x d (mm) / 1000 square metres.
export function zincConsumption(diaMm, gsm, productionMT, lossPct) {
  const perMetre = STEEL_KG_PER_MM2_PER_M * diaMm * diaMm; // kg of wire per metre
  const areaPerMetre = (Math.PI * diaMm) / 1000; // m2 per metre
  const areaPerTonne = (areaPerMetre / perMetre) * 1000; // m2 per tonne of wire
  const theoretical = (gsm * areaPerTonne) / 1000; // kg zinc per tonne of wire
  const withLoss = theoretical * (1 + (Number.isFinite(lossPct) ? lossPct : 0) / 100);
  return { areaPerTonne, theoretical, withLoss, total: withLoss * productionMT };
}

export function recovery(inputKg, outputKg, totalCost) {
  return {
    recoveryPct: (outputKg / inputKg) * 100,
    lossKg: inputKg - outputKg,
    costPerKg: totalCost / outputKg
  };
}

export function margin(cost, sell, qty, targetPct) {
  const profitPerKg = sell - cost;
  return {
    profitPerKg,
    marginPct: (profitPerKg / sell) * 100, // profit as % of selling price
    markupPct: (profitPerKg / cost) * 100, // profit as % of cost
    totalProfit: profitPerKg * qty,
    requiredRate: targetPct < 100 ? cost / (1 - targetPct / 100) : NaN
  };
}
