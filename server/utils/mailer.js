const nodemailer = require("nodemailer");

console.log("Initializing Nodemailer with user:", process.env.EMAIL_USER ? "EXISTS" : "MISSING");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Prevent hanging on cloud providers
  connectionTimeout: 10000, 
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Verify SMTP connection immediately upon server boot
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP Connection verification failed:", err.message);
  } else {
    console.log("✅ SMTP Server is ready to take messages");
  }
});

const sendNewEventNotification = async (recipientEmails, eventDetails) => {
  console.log(">> Inside sendNewEventNotification. Total emails to send:", recipientEmails.length);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ ERROR: EMAIL_USER or EMAIL_PASS environment variables are missing!");
    return;
  }

  const { name, description, date, campus } = eventDetails;

  for (const email of recipientEmails) {
    const mailOptions = {
      from: `"GDG AAUP PR Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🚀 New Event: ${name} (${campus} Campus)`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #202124;">
          <h2 style="color: #0F9D58;">New Campus Event: ${name}</h2>
          <p><strong>Campus:</strong> ${campus}</p>
          <p><strong>Date:</strong> ${date || "Unspecified"}</p>
          <p>${description}</p>
        </div>
      `,
    };

    try {
      console.log(`⏳ Attempting to send email to: ${email}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Sent successfully to ${email} (MessageId: ${info.messageId})`);
    } catch (err) {
      console.error(`❌ Failed sending to ${email}:`, err.message);
    }
  }
};

module.exports = { sendNewEventNotification };