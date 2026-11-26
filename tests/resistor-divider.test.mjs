import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDividerCandidates,
  getResistorValues,
} from "../static/tools/resistor-divider.mjs";

function exhaustiveCandidates({ vin, vout, biasCurrent = 0, currentRange, series }) {
  const candidates = [];
  for (const r1 of getResistorValues(series)) {
    for (const r2 of getResistorValues(series)) {
      const current = biasCurrent === 0
        ? vin / (r1 + r2)
        : (vin + biasCurrent * r2) / (r1 + r2);
      const aboveMinimum = currentRange.minInclusive === false
        ? current > currentRange.min
        : current >= currentRange.min;
      const belowMaximum = currentRange.maxInclusive === false
        ? current < currentRange.max
        : current <= currentRange.max;
      if (!aboveMinimum || !belowMaximum) continue;

      const voutActual = biasCurrent === 0
        ? vin * (r2 / (r1 + r2))
        : (vin - biasCurrent * r1) * (r2 / (r1 + r2));
      if (voutActual <= 0) continue;
      candidates.push({
        r1,
        r2,
        vout: voutActual,
        vinForTarget: vout * (1 + r1 / r2) + biasCurrent * r1,
        vError: Math.abs(voutActual - vout),
        current,
        powerR1: current * current * r1,
        powerR2: biasCurrent === 0
          ? current * current * r2
          : (voutActual * voutActual) / r2,
      });
    }
  }
  return candidates
    .sort((a, b) => a.vError - b.vError || a.r1 - b.r1 || a.r2 - b.r2)
    .slice(0, 5);
}

test("constrained search returns the same best pairs as exhaustive search", () => {
  const cases = [
    {
      vin: 12,
      vout: 3.3,
      series: "combined",
      currentRange: { min: 0.0005, max: 0.0006 },
    },
    {
      vin: 5,
      vout: 1.2,
      series: "e24",
      currentRange: { min: 0.01, max: 0.02 },
    },
    {
      vin: 24,
      vout: 5,
      series: "e96",
      currentRange: { min: 0, max: 0.00005, maxInclusive: false },
    },
    {
      vin: 12,
      vout: 3.3,
      biasCurrent: 0.00001,
      series: "e24",
      currentRange: { min: 0.0005, max: 0.0006 },
    },
  ];

  for (const input of cases) {
    assert.deepEqual(
      calculateDividerCandidates(input),
      exhaustiveCandidates(input)
    );
  }
});

test("bias current is included in output voltage, source current, and resistor selection", () => {
  const input = {
    vin: 12,
    vout: 3.3,
    biasCurrent: 0.00001,
    series: "e24",
    currentRange: { min: 0.0005, max: 0.0006 },
  };
  const candidates = calculateDividerCandidates(input);

  assert.deepEqual(candidates, exhaustiveCandidates(input));
  assert.ok(candidates.length > 0);
  for (const candidate of candidates) {
    assert.equal(
      candidate.vinForTarget,
      input.vout * (1 + candidate.r1 / candidate.r2) + input.biasCurrent * candidate.r1
    );
    assert.equal(
      candidate.current,
      (input.vin + input.biasCurrent * candidate.r2) / (candidate.r1 + candidate.r2)
    );
  }
});

test("zero bias preserves the existing divider calculations", () => {
  const input = {
    vin: 12,
    vout: 3.3,
    series: "combined",
    currentRange: { min: 0.0005, max: 0.0006 },
  };
  assert.deepEqual(
    calculateDividerCandidates(input),
    calculateDividerCandidates({ ...input, biasCurrent: 0 })
  );
});

test("includes candidates exactly on an inclusive minimum-current boundary", () => {
  const candidates = calculateDividerCandidates({
    vin: 12,
    vout: 1,
    series: "combined",
    currentRange: { min: 0.001, max: 0.0010001 },
  });

  assert.ok(candidates.some(({ r1, r2 }) => r1 === 11000 && r2 === 1000));
});

test("excludes candidates exactly on the exclusive ultra-low maximum", () => {
  const candidates = calculateDividerCandidates({
    vin: 12,
    vout: 1,
    series: "combined",
    currentRange: { min: 0, max: 0.0001, maxInclusive: false },
  });

  assert.ok(!candidates.some(({ r1, r2 }) => r1 === 110000 && r2 === 10000));
});
