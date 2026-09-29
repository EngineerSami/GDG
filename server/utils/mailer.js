const nodemailer = require("nodemailer");
const dns = require("node:dns");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, (err, address, family) => {
      callback(err, address, family);
    });
  },
  tls: {
    rejectUnauthorized: false,
    servername: "smtp.gmail.com",
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

const sendNewEventNotification = async (recipientEmails, eventDetails) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS missing. Skipping email notification.");
    return;
  }

  const { name, description, date, campus } = eventDetails;

  for (const email of recipientEmails) {
    try {
      console.log(`⏳ Attempting to send email to: ${email}...`);
      const info = await transporter.sendMail({
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
      });
      console.log(`✅ Sent successfully to ${email} (MessageId: ${info.messageId})`);
    } catch (err) {
      console.error(`❌ Failed sending to ${email}:`, err.message);
    }
  }
};

module.exports = { sendNewEventNotification };