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
 * Track events to Umami analytics
 */
async function trackUmamiEvent(
  request: Request,
  eventName: string,
  eventData: Record<string, any> = {}
): Promise<void> {
  try {
    if (!process.env.UMAMI_WEBSITE_ID || !process.env.UMAMI_ENDPOINT) {
      console.warn("Umami environment variables not configured");
      return;
    }

    const url = new URL(request.url);

    const payload = {
      type: "event",
      payload: {
        hostname: url.hostname,
        language: request.headers.get("accept-language")?.split(",")[0] || "en-US",
        referrer: request.headers.get("referer") || "",
        screen: "1920x1080",
        title: "Contact Form Email",
        url: url.pathname,
        website: process.env.UMAMI_WEBSITE_ID,
        name: eventName,
        data: eventData,
      },
    };

    const response = await fetch(`${process.env.UMAMI_ENDPOINT}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0 (Server)",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Umami tracking failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to track Umami event:", error);
  }
}

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

    // Track email received with honeypot status
    await trackUmamiEvent(request, "form_received", {
      honeypot_value: website || "",
      is_spam: website ? "true" : "false",
    });

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