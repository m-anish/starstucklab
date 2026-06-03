import type { APIRoute } from 'astro';
import { getResend, readRuntimeEnv } from '../../lib/resend';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resend = getResend(locals);
    const from = readRuntimeEnv('RESEND_FROM_EMAIL', locals) ?? 'Starstuck Lab <hello@starstucklab.com>';
    const to = readRuntimeEnv('ADMIN_EMAIL', locals) ?? 'hello@starstucklab.com';

    await resend.emails.send({
      from,
      to,
      reply_to: email,
      subject: `Message from ${name} via starstucklab.com`,
      html: `
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[contact] Send failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
