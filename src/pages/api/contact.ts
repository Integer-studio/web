import type { APIRoute } from 'astro';
import type { ContactFormData, ContactFormResponse } from '../../types/contact';
import { isValidEmail, isNotEmpty } from '../../utils/validation';
import { logContactFormSubmission, logError } from '../../utils/logger';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // parse
    const formData = await request.formData();

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

    // Log the form submission
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'Unknown';

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
