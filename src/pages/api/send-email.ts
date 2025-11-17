import dotenv from "dotenv";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { z } from "zod";

dotenv.config();

// Zod schema for email validation
const emailSchema = z.object({
  to: z.string().trim().email("Recipient email must be valid"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().min(1, "Message must be nonempty"),
  html: z.string().optional(),
  "h:Reply-To": z.string().trim().email("Reply-To must be a valid email"),
  website: z.string().optional(),
});

// Type from Zod schema
type EmailData = z.infer<typeof emailSchema>;

/**
 * Handle POST requests to send email through Mailgun.
 * @param {{ request: Request }} params - API context object containing the incoming request.
 * @param {Request} params.request - The incoming Request object.
 * @returns {Promise<Response>} A JSON response indicating success or failure.
 */
export async function POST(params: { request: Request }): Promise<Response> {
  const { request } = params;

  try {
    const emailData: unknown = await request.json();
    const validationResult = emailSchema.safeParse(emailData);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return new Response(
        JSON.stringify({
          success: false,
          message: "Validation failed",
          errors,
        }),
        { status: 400 },
      );
    }

    const {
      to,
      subject,
      text,
      html,
      "h:Reply-To": replyTo,
      website,
    } = validationResult.data as EmailData;

    // Honeypot trap—if filled, silently accept
    if (website) {
      console.log("Honeypot triggered");
      return new Response(
        JSON.stringify({ success: true, message: "Form received" }),
        { status: 200 },
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
      JSON.stringify({ success: true, message: "Email sent" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Mailgun error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to send email" }),
      { status: 500 },
    );
  }
}
