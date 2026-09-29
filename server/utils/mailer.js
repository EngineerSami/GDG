const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await resend.emails.send({
      from: "Your App <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", result);

    return result;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw error;
  }
};



transporter.verify()
  .then(() => {
    console.log("✅ Gmail SMTP connection successful");
  })
  .catch((error) => {
    console.error("❌ Gmail SMTP error:", error);
  });

module.exports = transporter;
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },

    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
};

const sendNewEventNotification = async (
  recipientEmails,
  eventDetails
) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials are missing. Skipping notifications.");
    return;
  }

  const transporter = createTransporter();

  const { name, description, date, campus } = eventDetails;

  // Check the SMTP connection before sending
  await transporter.verify();

  for (const email of recipientEmails) {
    try {
      console.log(`Attempting to send email to: ${email}`);

      const info = await transporter.sendMail({
        from: `"GDG AAUP PR Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `New Event: ${name} (${campus} Campus)`,

        text: `
New Campus Event: ${name}
Campus: ${campus}
Date: ${date || "Unspecified"}

${description}
        `,

        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #202124;">
            <h2 style="color: #0F9D58;">
              New Campus Event: ${name}
            </h2>
            <p><strong>Campus:</strong> ${campus}</p>
            <p><strong>Date:</strong> ${date || "Unspecified"}</p>
            <p>${description}</p>
          </div>
        `,
      });

      console.log(
        `Email sent to ${email}. Message ID: ${info.messageId}`
      );
    } catch (err) {
      console.error(
        `Failed to send email to ${email}:`,
        err.code || "",
        err.message
      );
    }
  }

  transporter.close();
};

module.exports = {sendEmail };