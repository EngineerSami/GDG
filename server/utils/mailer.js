const { Resend } = require("resend");

const sendNewEventNotification = async (recipientEmails, eventDetails) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is missing from environment variables.");
    return;
  }

  const resend = new Resend(apiKey);
  const { name, description, date, campus } = eventDetails;

  // Filter out dummy/invalid addresses to avoid bounce penalties
  const validRecipients = recipientEmails.filter(
    (email) => email && email.includes("@") && !email.startsWith("test")
  );

  console.log(`>> Sending event notification via HTTPS API to ${validRecipients.length} recipients.`);

  for (const email of validRecipients) {
    try {
      console.log(`⏳ Dispatching to: ${email}...`);
      
      const { data, error } = await resend.emails.send({
        from: "GDG AAUP <onboarding@resend.dev>",
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
                <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>📍 Campus Location:</strong> ${campus}</p>
              </div>
            </div>
            
            <div style="background-color: #f1f3f4; padding: 12px; text-align: center; font-size: 11px; color: #70757a;">
              You received this email because you are a registered member of GDG AAUP.
            </div>
          </div>
        `,
      });

      if (error) {
        console.error(`❌ Resend error for ${email}:`, error.message);
      } else {
        console.log(`✅ Delivered via HTTPS to ${email} (ID: ${data.id})`);
      }
    } catch (err) {
      console.error(`❌ Network error sending to ${email}:`, err.message);
    }
  }
};

module.exports = { sendNewEventNotification };