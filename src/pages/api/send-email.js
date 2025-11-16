import dotenv from "dotenv";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { z } from "zod";

dotenv.config();

const emailSchema = z.object({
  to: z.string().trim().email("Recipient email must be valid"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().min(1, "Message must be nonempty"),
  html: z.string().optional(),
  "h:Reply-To": z.string().trim().email("Reply-To must be a valid email"),
  website: z.string().optional(),
});

export async function POST({ request }) {
  try {
    const emailData = await request.json();

    // Validate the request body using Zod
    const validationResult = emailSchema.safeParse(emailData);
    console.log(emailData);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return new Response(
        JSON.stringify({
          success: false,
          message: "Validation failed",
          errors,
        }),
        { status: 400 }
      );
    }

    const { to, subject, text, html, "h:Reply-To": replyTo, website } = validationResult.data;

    // Honeypot check
    if (website) {
      console.log("Honeypot triggered at API level - possible bot submission");
      // Return success to not alert the bot
      return new Response(
        JSON.stringify({ success: true, message: "Form received" }),
        { status: 200 }
      );
    }

    if (!process.env.MAILGUN_API_KEY) {
      throw new Error("Missing Mailgun API key");
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });

    const messageData = {
      from: "Munch Industries <postmaster@mg.munch-industries.com>",
      to,
      subject,
      text,
      html,
      ...(replyTo && { "h:Reply-To": replyTo }),
    };

    await mg.messages.create("mg.munch-industries.com", messageData);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" })
    );
  } catch (error) {
    console.error("Mailgun error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to send email" }),
      { status: 500 }
    );
  }
}
