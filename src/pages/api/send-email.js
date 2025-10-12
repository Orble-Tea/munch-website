import dotenv from "dotenv";
import FormData from "form-data";
import Mailgun from "mailgun.js";

dotenv.config();

export async function POST({ request }) {
  const emailData = await request.json();

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
  });

  try {
    // Build the message object
    const messageData = {
      from: "Munch Industries <postmaster@mg.munch-industries.com>",
      to: emailData.to,
      subject: emailData.subject || "No Subject",
    };

    // Add text or html content if they exist
    if (emailData.text) {
      messageData.text = emailData.text;
    }
    if (emailData.html) {
      messageData.html = emailData.html;
    }

    // Add reply-to if it exists
    if (emailData["h:Reply-To"]) {
      messageData["h:Reply-To"] = emailData["h:Reply-To"];
    }

    const data = await mg.messages.create("mg.munch-industries.com", messageData);

    return new Response(JSON.stringify({ message: "Email sent", data }), {
      status: 200,
    });
  } catch (error) {
    console.error("Mailgun error:", error);
    return new Response(
      JSON.stringify({ message: "Failed to send email", error: error.message }),
      { status: 500 }
    );
  }
}