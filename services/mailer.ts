import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP__PASS,
  },
});

async function sendMail(
  to: string,
  subject: string,
  text: string,
  html: string
) {
  const info = await transporter.sendMail({
from: '"GirlyHub 💖" <officialgirlyhub@gmail.com>', // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
  });
}

export default sendMail;
