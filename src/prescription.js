import fs from "node:fs";
import path from "node:path";

export function parseScaleCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    const beginnings = parseGroups(row.Beginnings);
    const endings = parseGroups(row.Endings);

    if (beginnings.length !== endings.length) {
      throw new Error(`${row.Key} has ${beginnings.length} beginning groups but ${endings.length} ending groups.`);
    }

    return {
      key: row.Key,
      beginnings,
      endings,
      arpeggios: parseCount(row.Arpeggios, row.Key, "Arpeggios"),
      completeScales: parseCount(row["Complete Scales"], row.Key, "Complete Scales"),
      alternatingThirds: parseCount(row["Alternating Thirds"], row.Key, "Alternating Thirds"),
    };
  });
}

export function loadScaleData(csvPath) {
  return parseScaleCsv(fs.readFileSync(csvPath, "utf8"));
}

export function readHistory(historyPath) {
  if (!fs.existsSync(historyPath)) {
    return [];
  }

  const text = fs.readFileSync(historyPath, "utf8").trim();
  return text ? JSON.parse(text) : [];
}

export function writeHistory(historyPath, history) {
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
}

export function generatePrescription(keys, history, options = {}) {
  const today = options.date ?? localIsoDate();
  const rng = options.rng ?? Math.random;
  const key = options.key ?? chooseEligibleKey(keys, history, rng);

  const modularCount = key.completeScales > 0 ? 1 : 2;
  const completeScaleCount = key.beginnings.some((count) => count > 0) ? 1 : 2;

  const modularScales = key.beginnings.some((count) => count > 0)
    ? chooseUniqueModularScales(key, modularCount, rng)
    : [];
  const completeScales = key.completeScales > 0
    ? chooseUniqueNumbers(key.completeScales, completeScaleCount, rng)
    : [];

  return {
    date: today,
    key: key.key,
    modularScales,
    completeScales,
    arpeggio: chooseNumber(key.arpeggios, rng),
    alternatingThirds: chooseNumber(key.alternatingThirds, rng),
  };
}

export function appendKeyHistory(history, prescription, limit = 30) {
  const withoutDuplicateToday = history.filter((entry) => entry.date !== prescription.date);
  return [
    ...withoutDuplicateToday,
    { date: prescription.date, key: prescription.key },
  ].slice(-limit);
}

export function formatPrescription(prescription) {
  const lines = [
    `Good morning. Today's Rabbath practice key is: ${prescription.key}`,
    "",
  ];

  prescription.modularScales.forEach((scale, index) => {
    lines.push(
      `Modular scale ${index + 1}: type ${scale.type}, beginning ${scale.beginning}, ending ${scale.ending}`,
    );
  });

  prescription.completeScales.forEach((scale, index) => {
    lines.push(`Complete scale ${index + 1}: ${scale}`);
  });

  lines.push(
    `Arpeggio: ${prescription.arpeggio}`,
    `Alternating thirds: ${prescription.alternatingThirds}`,
  );

  return lines.join("\n");
}

function chooseEligibleKey(keys, history, rng) {
  const recentKeys = new Set(history.slice(-10).map((entry) => entry.key));
  const eligibleKeys = keys.filter((key) => !recentKeys.has(key.key));

  if (eligibleKeys.length === 0) {
    throw new Error("No eligible keys are available after excluding the last 10 history entries.");
  }

  return eligibleKeys[Math.floor(rng() * eligibleKeys.length)];
}

function chooseUniqueModularScales(key, count, rng) {
  const combinations = [];

  key.beginnings.forEach((beginningCount, groupIndex) => {
    const endingCount = key.endings[groupIndex];
    for (let beginning = 1; beginning <= beginningCount; beginning += 1) {
      for (let ending = 1; ending <= endingCount; ending += 1) {
        combinations.push({
          type: groupIndex + 1,
          beginning,
          ending,
        });
      }
    }
  });

  if (combinations.length < count) {
    throw new Error(`${key.key} has only ${combinations.length} modular combinations.`);
  }

  return sampleUnique(combinations, count, rng);
}

function chooseUniqueNumbers(max, count, rng) {
  return sampleUnique(
    Array.from({ length: max }, (_, index) => index + 1),
    count,
    rng,
  );
}

function sampleUnique(items, count, rng) {
  const pool = [...items];
  const selected = [];

  for (let index = 0; index < count; index += 1) {
    const choiceIndex = Math.floor(rng() * pool.length);
    selected.push(pool.splice(choiceIndex, 1)[0]);
  }

  return selected;
}

function chooseNumber(max, rng) {
  if (max < 1) {
    throw new Error("Cannot choose from an empty exercise set.");
  }

  return Math.floor(rng() * max) + 1;
}

function parseGroups(value) {
  return value.split("+").map((part) => parseCount(part, "CSV", "group"));
}

function parseCount(value, key, column) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || String(parsed) !== value) {
    throw new Error(`${key} has invalid ${column} value: ${value}`);
  }

  return parsed;
}

function localIsoDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
