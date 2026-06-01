import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  appendKeyHistory,
  generatePrescription,
  parseScaleCsv,
} from "../src/prescription.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csv = fs.readFileSync(path.join(root, "data", "rabbath-scales.csv"), "utf8");
const keys = parseScaleCsv(csv);

test("CSV data parses all keys and matching modular groups", () => {
  assert.equal(keys.length, 22);
  for (const key of keys) {
    assert.equal(key.beginnings.length, key.endings.length, key.key);
    assert.ok(key.arpeggios > 0, key.key);
    assert.ok(key.alternatingThirds > 0, key.key);
  }
});

test("Eb major gets two complete scales and no modular scales", () => {
  const ebMajor = keys.find((key) => key.key === "Eb major");
  const prescription = generatePrescription(keys, [], {
    key: ebMajor,
    rng: fixedRng(0.1, 0.2, 0.3, 0.4),
  });

  assert.equal(prescription.modularScales.length, 0);
  assert.equal(prescription.completeScales.length, 2);
  assert.notEqual(prescription.completeScales[0], prescription.completeScales[1]);
});

test("minor keys without complete scales get two unique modular combinations", () => {
  const bMinor = keys.find((key) => key.key === "B minor");
  const prescription = generatePrescription(keys, [], {
    key: bMinor,
    rng: fixedRng(0, 0, 0.3, 0.4),
  });

  assert.equal(prescription.modularScales.length, 2);
  assert.notDeepEqual(prescription.modularScales[0], prescription.modularScales[1]);
  assert.equal(prescription.completeScales.length, 0);
});

test("keys with modular and complete scales get one of each", () => {
  const cMinor = keys.find((key) => key.key === "C minor");
  const prescription = generatePrescription(keys, [], {
    key: cMinor,
    rng: fixedRng(0.1, 0.2, 0.3, 0.4),
  });

  assert.equal(prescription.modularScales.length, 1);
  assert.equal(prescription.completeScales.length, 1);
});

test("key selection excludes the last 10 history entries", () => {
  const recentHistory = keys.slice(0, 10).map((key, index) => ({
    date: `2026-05-${String(index + 1).padStart(2, "0")}`,
    key: key.key,
  }));

  const prescription = generatePrescription(keys, recentHistory, {
    rng: fixedRng(0),
  });

  assert.equal(prescription.key, keys[10].key);
});

test("history stores only date and key", () => {
  const next = appendKeyHistory([], {
    date: "2026-06-01",
    key: "C major",
    modularScales: [{ type: 1, beginning: 1, ending: 1 }],
  });

  assert.deepEqual(next, [{ date: "2026-06-01", key: "C major" }]);
});

function fixedRng(...values) {
  let index = 0;
  return () => values[index++ % values.length];
}
