export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  description: string;
}

export interface ContactFormResponse {
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ContactFormSubmission extends ContactFormData {
  timestamp: string;
  userAgent?: string;
  ip?: string;
}
