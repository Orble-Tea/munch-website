import dotenv from "dotenv";
dotenv.config();

export async function POST({ request }) {
  const emailData = await request.json();

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  // send a POST request to the SendGrid API
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  });
  if (!response.ok) {
    return new Response(JSON.stringify({ message: "Failed to send email" }), {
      status: response.status,
    });
  }

  return new Response(JSON.stringify({ message: "Email sent" }), {
    status: response.status,
  });
}
