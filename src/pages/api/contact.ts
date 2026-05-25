import type { APIRoute } from 'astro';
import type { ContactFormData, ContactFormResponse } from '../../types/contact';
import { isValidEmail, isNotEmpty } from '../../utils/validation';
import { logContactFormSubmission, logError, logWarn } from '../../utils/logger';

export const prerender = false;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;
const MIN_SUBMISSION_TIME_MS = 3000;
const submissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = submissions.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  submissions.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  submissions.set(ip, recent);
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'Unknown';

    if (clientIP !== 'Unknown' && isRateLimited(clientIP)) {
      logWarn('Rate limited submission', { clientIP });
      return new Response(
        JSON.stringify({
          success: false,
          errors: ['Příliš mnoho požadavků. Zkuste to prosím za chvíli.'],
        } satisfies ContactFormResponse),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();

    const honeypot = formData.get('website') as string;
    if (honeypot) {
      logWarn('Honeypot triggered', { clientIP });
      return new Response(
        JSON.stringify({ success: true, message: 'Děkujeme za odeslání.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const turnstileToken = formData.get('cf-turnstile-response') as string;
    if (!turnstileToken) {
      return new Response(
        JSON.stringify({
          success: false,
          errors: ['Ověření proti spamu je povinné.'],
        } satisfies ContactFormResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: import.meta.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || '',
          response: turnstileToken,
          remoteip: clientIP,
        }),
      }
    );
    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      logWarn('Turnstile verification failed', { clientIP, codes: turnstileResult['error-codes'] });
      return new Response(
        JSON.stringify({
          success: false,
          errors: ['Ověření proti spamu selhalo. Zkuste to prosím znovu.'],
        } satisfies ContactFormResponse),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const timestamp = formData.get('_timestamp') as string;
    if (timestamp) {
      const elapsed = Date.now() - parseInt(timestamp, 10);
      if (elapsed < MIN_SUBMISSION_TIME_MS) {
        logWarn('Submission too fast', { elapsed, clientIP });
        return new Response(
          JSON.stringify({ success: true, message: 'Děkujeme za odeslání.' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const contactData: ContactFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      description: formData.get('description') as string,
    };
    // validate
    const errors: string[] = [];

    if (!isNotEmpty(contactData.name)) {
      errors.push('Jméno je povinné');
    }

    if (!isNotEmpty(contactData.email)) {
      errors.push('Email je povinný');
    } else if (!isValidEmail(contactData.email)) {
      errors.push('Email není validní');
    }

    if (!isNotEmpty(contactData.company)) {
      errors.push('Společnost je povinná');
    }

    if (!isNotEmpty(contactData.description)) {
      errors.push('Popis je povinný');
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';

    logContactFormSubmission({
      name: contactData.name,
      email: contactData.email,
      company: contactData.company,
      description: contactData.description,
      userAgent,
      clientIP,
    });

    // Return success response
    const successResponse: ContactFormResponse = {
      success: true,
      message:
        'Formulář jsme úspěšně obdrželi! Do 24 hodin se vám ozveme na váš email.',
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logError('Error processing contact form', error);

    const errorResponse: ContactFormResponse = {
      success: false,
      errors: ['Došlo k chybě při zpracování formuláře'],
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
