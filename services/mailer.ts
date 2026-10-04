import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || "officialgirlyhub@gmail.com";
const smtpPass = process.env.SMTP_PASS || process.env.SMTP__PASS;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export interface MailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  encoding?: string;
}

async function sendMail(
  to: string,
  subject: string,
  text: string,
  html: string,
  attachments?: MailAttachment[],
) {
  const fromAddress = `"${process.env.SMTP_FROM_NAME || "GirlyHub 💖"}" <${smtpUser}>`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: text || subject,
    html,
    attachments,
  });

  return info;
}

export default sendMail;

