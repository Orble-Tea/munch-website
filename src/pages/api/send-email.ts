import dotenv from "dotenv";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { z } from "zod";

dotenv.config();
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;

// Zod schema for email validation
const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  text: z.string().min(1, "Message must be nonempty"),
  html: z.string().optional(),
  "h:Reply-To": z.string().trim().email("Reply-To must be a valid email"),
  website: z.string().optional(),
});

type EmailData = z.infer<typeof emailSchema>;

/**
 * Track events to Umami analytics
 * @param request
 * @param eventName
 * @param eventData
 */
async function trackUmamiEvent(
  request: Request,
  eventName: string,
  eventData: Record<string, string> = {},
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
        website: process.env.UMAMI_WEBSITE_ID,
        name: eventName,
        data: eventData,
      },
    };

    const response = await fetch(`${process.env.UMAMI_ENDPOINT}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          request.headers.get("user-agent") || "Mozilla/5.0 (Server)",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Umami tracking failed with status: ${response.status}`);
    } else {
      console.debug("Umami tracking success");
    }
  } catch (error) {
    console.error("Umami tracking error:", error);
  }
}

/**
 * Handle POST requests to send email through Mailgun.
 * @param root0
 * @param root0.request
 */
export async function POST({
  request,
}: {
  request: Request;
}): Promise<Response> {
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
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const {
      subject,
      text,
      html,
      "h:Reply-To": replyTo,
      website,
    } = validationResult.data as EmailData;

    // Track the form submission with honeypot status
    trackUmamiEvent(request, "form_received", {
      is_spam: website ? "true" : "false",
    });

    // Honeypot trap—if filled, silently accept
    if (website) {
      console.debug("Honeypot triggered - returning fake success");
      return new Response(
        JSON.stringify({ success: true, message: "Form received" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
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
      to: CONTACT_EMAIL,
      subject,
      text,
      ...(html && { html }),
      ...(replyTo && { "h:Reply-To": replyTo }),
    };

    await mg.messages.create("mg.munch-industries.com", messageData);

    console.debug("Email sent successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send email",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
