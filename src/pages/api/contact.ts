import type { APIRoute } from 'astro';
import { getResend, readRuntimeEnv } from '../../lib/resend';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    // Honeypot: humans never see/fill this field. Pretend success so bots don't retry.
    if (String(data.get('company') ?? '').trim()) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cloudflare Turnstile. Enforced wherever TURNSTILE_SECRET_KEY is set (prod);
    // skipped in local dev when it isn't, so the form still works without the secret.
    const turnstileSecret = readRuntimeEnv('TURNSTILE_SECRET_KEY', locals);
    if (turnstileSecret) {
      const verify = new FormData();
      verify.append('secret', turnstileSecret);
      verify.append('response', String(data.get('cf-turnstile-response') ?? ''));
      const ip = request.headers.get('CF-Connecting-IP');
      if (ip) verify.append('remoteip', ip);

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: verify,
      });
      const outcome = (await verifyRes.json()) as { success: boolean };
      if (!outcome.success) {
        return new Response(JSON.stringify({ error: 'Spam verification failed. Please try again.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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
