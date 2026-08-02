import "dotenv/config";
import nodemailer from "nodemailer";

const to = process.argv[2] || "aryalbishal9876@gmail.com";

const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || "587");
const from = process.env.SMTP_FROM?.trim() || `Sikau Paisa <${user}>`;

if (!user || !pass) {
  console.error("Missing SMTP_USER or SMTP_PASS in .env");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

const otp = String(Math.floor(100000 + Math.random() * 900000));

try {
  const info = await transport.sendMail({
    from,
    to,
    subject: "Sikau Paisa SMTP test",
    text: `SMTP is working.\n\nTest OTP: ${otp}\n\nSent to ${to} from ${user}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Sikau Paisa SMTP test</h2>
        <p>If you received this, Gmail SMTP is configured correctly.</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">Test OTP: ${otp}</p>
        <p style="color: #64748b;">Sent to ${to}</p>
      </div>
    `,
  });

  console.log("Email sent successfully.");
  console.log("To:", to);
  console.log("From:", from);
  console.log("Message ID:", info.messageId);
  console.log("Test OTP:", otp);
} catch (error) {
  console.error("Failed to send email:");
  console.error(error);
  process.exit(1);
}
