import nodemailer from "nodemailer";

const requiredEnv = [
  "SCALE_RX_EMAIL_TO",
  "SCALE_RX_EMAIL_FROM",
  "SCALE_RX_SMTP_HOST",
  "SCALE_RX_SMTP_PORT",
  "SCALE_RX_SMTP_USER",
  "SCALE_RX_SMTP_PASS",
];

export function validateEmailConfig(env = process.env) {
  const missing = requiredEnv.filter((name) => !env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }
}

export async function sendPrescriptionEmail(prescription, body, env = process.env) {
  validateEmailConfig(env);

  const transporter = nodemailer.createTransport({
    host: env.SCALE_RX_SMTP_HOST,
    port: Number.parseInt(env.SCALE_RX_SMTP_PORT, 10),
    secure: Number.parseInt(env.SCALE_RX_SMTP_PORT, 10) === 465,
    auth: {
      user: env.SCALE_RX_SMTP_USER,
      pass: env.SCALE_RX_SMTP_PASS,
    },
  });

  return transporter.sendMail({
    to: env.SCALE_RX_EMAIL_TO,
    from: env.SCALE_RX_EMAIL_FROM,
    subject: `Scale Rx: ${prescription.key} for ${prescription.date}`,
    text: body,
  });
}
