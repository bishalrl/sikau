import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured. Add it to .env and restart the server.`);
  }
  return value;
}

export function getSmtpConfig() {
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS").replace(/\s+/g, "");
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "587");
  const fromRaw = process.env.SMTP_FROM?.trim();
  const from = fromRaw || `Sikau Paisa <${user}>`;

  return { user, pass, host, port, from };
}

let cachedTransport: nodemailer.Transporter | null = null;

export function createMailTransport() {
  if (cachedTransport) return cachedTransport;

  const { user, pass, host, port } = getSmtpConfig();
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransport;
}

export async function sendOtpEmail(to: string, otp: string) {
  const { from, user } = getSmtpConfig();
  const transport = createMailTransport();

  const info = await transport.sendMail({
    from,
    to,
    subject: "Your Sikau Paisa verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not create an account, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Verify your email</h2>
        <p style="margin: 0 0 16px;">Use this one-time code to finish creating your Sikau Paisa account:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 0 0 16px;">${otp}</p>
        <p style="margin: 0; color: #64748b;">This code expires in 10 minutes.</p>
      </div>
    `,
  });

  console.log(`OTP email sent to ${to} via ${user}. messageId=${info.messageId}`);
  return info;
}
