import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { emailOTP } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { SMTP_EMAIL, SMTP_PASSWORD } from "$env/static/private";

// Define the function parameters as a TypeScript interface
interface SendEmailParams {
  email: string;
  otp: string;
  name: string;
}

export async function sendEmail({ email, otp, name }: SendEmailParams): Promise<boolean> {
  console.log("Creating transporter...");

  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_EMAIL, // Your email address
      pass: SMTP_PASSWORD, // Your email password
    },
  });

  console.log("Transporter created.");

  // Email message options
  const mailOptions = {
    from: SMTP_EMAIL, // Sender address
    to: email, // Recipient address
    subject: "Your OTP Verification Code", // Subject line
    html: `
        <h2>Hi ${name},</h2>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `, // HTML body content
  };

  try {
    console.log("Sending email...");
    // Send email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to: ", email);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendEmail({ email, otp, name: type });
      },
      otpLength: 5
    })
  ]
})