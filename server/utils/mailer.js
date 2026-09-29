const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a notification email to members of a specific campus
 * @param {Array<string>} recipientEmails
 * @param {Object} eventDetails
 */
const sendNewEventNotification = async (recipientEmails, eventDetails) => {
  if (!recipientEmails || recipientEmails.length === 0) return;

  const { name, description, date, campus } = eventDetails;

  const mailOptions = {
    from: `"GDG AAUP PR Team" <${process.env.EMAIL_USER}>`,
    bcc: recipientEmails, // BCC ensures members don't see each other's email addresses
    subject: `🚀 New Event Announcement: ${name} (${campus} Campus)`,
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
            <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>📍 Campus Location:</strong> ${campus}</p>
          </div>
          
          <p style="font-size: 13px; color: #5f6368;">
            Log in to the dashboard to review partners, add sponsors, or join the discussion.
          </p>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://gdgprteam.vercel.app" style="background-color: #0F9D58; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <div style="background-color: #f1f3f4; padding: 12px; text-align: center; font-size: 11px; color: #70757a;">
          You received this email because you are a registered member of GDG AAUP (${campus} Campus).
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Notification sent for "${name}" to ${recipientEmails.length} member(s): ${info.messageId}`);
  } catch (error) {
    console.error("Failed to send event notification email:", error);
  }
};

module.exports = { sendNewEventNotification };