const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection directly on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP Transporter Verification Failed:", error.message);
  } else {
    console.log("✅ SMTP Transporter connected successfully");
  }
});

const sendNewEventNotification = async (recipientEmails, eventDetails) => {
  if (!recipientEmails || recipientEmails.length === 0) return;

  const { name, description, date, campus } = eventDetails;

  const sendPromises = recipientEmails.map((email) => {
    const mailOptions = {
      from: `"GDG AAUP PR Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🚀 New Event: ${name} (${campus} Campus)`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 600px; margin: auto; border: 1px solid #e0e4e8; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0F9D58; color: white; padding: 20px 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">New Campus Event Announced!</h2>
            <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">GDG AAUP — ${campus} Campus</p>
          </div>
          <div style="padding: 24px;">
            <h3 style="color: #202124; margin-top: 0; font-size: 18px;">${name}</h3>
            <p style="color: #5f6368; font-size: 14px; margin-bottom: 16px;">${description}</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #0F9D58; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px;"><strong>📅 Scheduled Date:</strong> ${date || "To be announced"}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>📍 Campus:</strong> ${campus}</p>
            </div>
          </div>
        </div>
      `,
    };

    return transporter.sendMail(mailOptions);
  });

  const results = await Promise.allSettled(sendPromises);

  results.forEach((res, idx) => {
    if (res.status === "fulfilled") {
      console.log(`✉️ Delivered successfully to: ${recipientEmails[idx]}`);
    } else {
      console.error(`❌ Failed delivering to ${recipientEmails[idx]}:`, res.reason.message);
    }
  });
};

module.exports = { sendNewEventNotification };