const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNewEventNotification = async (recipientEmails, eventDetails) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY environment variable");
    return;
  }

  const { name, description, date, campus } = eventDetails;

  for (const email of recipientEmails) {
    try {
      console.log(`⏳ Sending via HTTPS to: ${email}...`);
      const { data, error } = await resend.emails.send({
        from: "GDG AAUP <onboarding@resend.dev>", // Or your verified domain
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

      if (error) {
        console.error(`❌ Delivery error for ${email}:`, error.message);
      } else {
        console.log(`✅ Delivered via API to ${email} (ID: ${data.id})`);
      }
    } catch (err) {
      console.error(`❌ Exception sending to ${email}:`, err.message);
    }
  }
};

module.exports = { sendNewEventNotification };