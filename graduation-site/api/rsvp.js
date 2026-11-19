// Vercel serverless function: emails you whenever a guest confirms.
// Needs the environment variable RESEND_API_KEY (and optionally RSVP_TO_EMAIL).

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'Email service is not configured' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const name = String((body && body.name) || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!name) return res.status(400).json({ ok: false, error: 'Please enter your name' });

  const to = process.env.RSVP_TO_EMAIL || 'philipndege@icloud.com';
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short' });
  const safe = esc(name);

  const html = `<!DOCTYPE html>
<html lang="en-GB"><body style="margin:0;padding:0;background:#060509;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060509;padding:36px 14px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0d0a0f;border:1px solid #4a3d2b;border-radius:18px;">
    <tr><td align="center" style="padding:42px 34px 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#d4b06a;">RSVP Confirmed &#10022;</td></tr>
    <tr><td align="center" style="padding:6px 34px 0;"><div style="width:48px;height:1px;background:#d4b06a;"></div></td></tr>
    <tr><td align="center" style="padding:26px 34px 6px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.15;color:#f3e9d6;">${safe}<br>will be there.</td></tr>
    <tr><td align="center" style="padding:10px 40px 26px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:1.6;color:#b9a68a;">has just confirmed their attendance at your graduation celebration.</td></tr>
    <tr><td style="padding:0 34px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2b2318;border-bottom:1px solid #2b2318;">
      <tr><td style="padding:14px 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8a6f55;">Occasion</td></tr>
      <tr><td style="padding:0 0 12px;font-family:Georgia,serif;font-size:17px;color:#f3e9d6;">Graduation of Philip Ndege, Class of 2026</td></tr>
      <tr><td style="padding:4px 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8a6f55;">Date and venue</td></tr>
      <tr><td style="padding:0 0 12px;font-family:Georgia,serif;font-size:17px;color:#f3e9d6;">18th December 2026, 8:00 AM to 5:00 PM<br>Kabarak University</td></tr>
      <tr><td style="padding:4px 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8a6f55;">Received</td></tr>
      <tr><td style="padding:0 0 16px;font-family:Georgia,serif;font-size:15px;color:#b9a68a;">${esc(when)} (Nairobi time)</td></tr>
    </table></td></tr>
    <tr><td align="center" style="padding:26px 34px 38px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8a6f55;">#PILOT &middot; Under a sky full of stars</td></tr>
  </table>
</td></tr></table></body></html>`;

  const text = `${name} will attend your graduation.\n\nThey have just confirmed their attendance.\n\nGraduation of Philip Ndege, Class of 2026\n18th December 2026, 8:00 AM to 5:00 PM\nKabarak University\n\nReceived: ${when} (Nairobi time)\n`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Graduation RSVP <onboarding@resend.dev>',
        to: [to],
        subject: `${name} will be attending your graduation`,
        html,
        text,
      }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'Could not send the confirmation' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Could not send the confirmation' });
  }
};
