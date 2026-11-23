const e24Values = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];
const e96Values = [
  1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30,
  1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74,
  1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32,
  2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09,
  3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
  4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49,
  5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32,
  7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76,
];
const decades = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000];

const seriesValues = {
  e24: e24Values,
  e96: e96Values,
  combined: [...new Set([...e24Values, ...e96Values])],
};

const resistorsBySeries = Object.fromEntries(
  Object.entries(seriesValues).map(([series, values]) => [
    series,
    Object.freeze(
      [
        ...new Set(
          decades.flatMap((decade) =>
            values.map((value) => Number((value * decade).toFixed(2)))
          )
        ),
      ].sort(
        (a, b) => a - b
      )
    ),
  ])
);

export function getResistorValues(series) {
  const values = resistorsBySeries[series];
  if (!values) throw new RangeError(`Unknown resistor series: ${series}`);
  return values;
}

function lowerBound(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] < target) low = mid + 1;
    else high = mid;
  }
  return low;
}

function firstIndexAtMaximumCurrent(values, r1, vin, range) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const current = vin / (r1 + values[mid]);
    const withinMaximum = range.maxInclusive === false
      ? current < range.max
      : current <= range.max;
    if (withinMaximum) high = mid;
    else low = mid + 1;
  }
  return low;
}

function firstIndexBelowMinimumCurrent(values, r1, vin, range) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const current = vin / (r1 + values[mid]);
    const belowMinimum = range.minInclusive === false
      ? current <= range.min
      : current < range.min;
    if (belowMinimum) high = mid;
    else low = mid + 1;
  }
  return low;
}

function isCurrentInRange(current, range) {
  const aboveMinimum = range.minInclusive === false
    ? current > range.min
    : current >= range.min;
  const belowMaximum = range.maxInclusive === false
    ? current < range.max
    : current <= range.max;
  return aboveMinimum && belowMaximum;
}

export function calculateDividerCandidates({
  vin,
  vout,
  currentRange,
  series = "combined",
  limit = 5,
}) {
  if (!Number.isFinite(vin) || !Number.isFinite(vout) || vin <= 0 || vout <= 0 || vout >= vin) {
    throw new RangeError("Expected finite voltages with 0 < Vout < Vin.");
  }
  if (
    !currentRange ||
    !Number.isFinite(currentRange.min) ||
    !Number.isFinite(currentRange.max) ||
    currentRange.min < 0 ||
    currentRange.max <= currentRange.min
  ) {
    throw new RangeError("Expected a valid current range.");
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("The result limit must be a positive integer.");
  }

  const resistors = getResistorValues(series);
  const best = [];

  for (const r1 of resistors) {
    const idealR2 = (vout * r1) / (vin - vout);
    const first = firstIndexAtMaximumCurrent(resistors, r1, vin, currentRange);
    const last = currentRange.min === 0
      ? resistors.length
      : firstIndexBelowMinimumCurrent(resistors, r1, vin, currentRange);

    if (first >= last) continue;

    const idealIndex = lowerBound(resistors, idealR2);
    const splitIndex = Math.max(first, Math.min(last, idealIndex));
    const candidateIndices = new Set();
    for (let offset = 0; offset < limit; offset += 1) {
      const lowerIndex = splitIndex - offset - 1;
      const upperIndex = splitIndex + offset;
      if (lowerIndex >= first) candidateIndices.add(lowerIndex);
      if (upperIndex < last) candidateIndices.add(upperIndex);
    }
    for (const candidateIndex of candidateIndices) {
      const r2 = resistors[candidateIndex];
      const totalResistance = r1 + r2;
      const current = vin / totalResistance;
      if (!isCurrentInRange(current, currentRange)) continue;

      const voutActual = vin * (r2 / totalResistance);
      best.push({
        r1,
        r2,
        vout: voutActual,
        vError: Math.abs(voutActual - vout),
        current,
        powerR1: current * current * r1,
        powerR2: current * current * r2,
      });
    }
  }

  return best
    .sort((a, b) => a.vError - b.vError || a.r1 - b.r1 || a.r2 - b.r2)
    .slice(0, limit);
}
