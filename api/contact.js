module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const { name, email, phone, date, readyTime, venue, service, message } = body || {};

  if (!email || !name) return res.status(400).json({ error: 'Missing required fields' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'Mail not configured' });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Makeup by Sherry B <hello@makeupbysherryb.com>',
        to: ['makeupbysherryb@gmail.com'],
        reply_to: email,
        subject: `New Inquiry — ${name}`,
        html: `
          <h2 style="font-family:sans-serif;">New Website Inquiry</h2>
          <table style="font-family:sans-serif;font-size:14px;line-height:2;">
            <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            ${phone ? `<tr><td><strong>Phone:</strong></td><td>${phone}</td></tr>` : ''}
            ${date ? `<tr><td><strong>Wedding Date:</strong></td><td>${date}</td></tr>` : ''}
            ${readyTime ? `<tr><td><strong>Ready By:</strong></td><td>${readyTime}</td></tr>` : ''}
            ${venue ? `<tr><td><strong>Venue / Location:</strong></td><td>${venue}</td></tr>` : ''}
            ${service ? `<tr><td><strong>Service:</strong></td><td>${service}</td></tr>` : ''}
            ${message ? `<tr><td><strong>Message:</strong></td><td>${message}</td></tr>` : ''}
          </table>
          <p style="font-family:sans-serif;font-size:12px;color:#999;">Sent from makeupbysherryb.com</p>
        `
      })
    });

    if (!r.ok) throw new Error(await r.text());
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[contact]', e.message);
    return res.status(500).json({ error: 'Failed to send' });
  }
};
