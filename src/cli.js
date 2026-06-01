import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { sendPrescriptionEmail, validateEmailConfig } from "./email.js";
import {
  appendKeyHistory,
  formatPrescription,
  generatePrescription,
  loadScaleData,
  readHistory,
  writeHistory,
} from "./prescription.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "rabbath-scales.csv");
const historyPath = path.join(root, "data", "history.json");
const args = parseArgs(process.argv.slice(2));
const date = args.date ?? process.env.SCALE_RX_DATE;

const keys = loadScaleData(dataPath);
const history = readHistory(historyPath);
const prescription = generatePrescription(keys, history, { date });
const body = formatPrescription(prescription);

if (args.checkEmailConfig) {
  validateEmailConfig();
  console.log("Email configuration looks complete.");
  process.exit(0);
}

if (args.email) {
  await sendPrescriptionEmail(prescription, body);
  console.log(`Email sent to ${process.env.SCALE_RX_EMAIL_TO}.`);
}

if (!args.dryRun && !args.emailTest) {
  writeHistory(historyPath, appendKeyHistory(history, prescription));
}

console.log(body);

function parseArgs(args) {
  const parsed = {
    checkEmailConfig: false,
    date: undefined,
    dryRun: false,
    email: false,
    emailTest: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--email") {
      parsed.email = true;
    } else if (arg === "--email-test") {
      parsed.email = true;
      parsed.emailTest = true;
      parsed.dryRun = true;
    } else if (arg === "--check-email-config") {
      parsed.checkEmailConfig = true;
    } else if (arg === "--date") {
      parsed.date = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}
