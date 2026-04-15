import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

import config from '@/shared/config/config.js';
import logger from '@/shared/config/logger.js';
import { Message } from '@/shared/email/email.interfaces.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirWithoutDist = __dirname.includes('dist') ? __dirname.replace(/dist/, '') : __dirname;
const templateSearchRoots = [
  path.resolve(process.cwd(), 'src/shared/emailTemplate'),
  path.resolve(process.cwd(), 'dist/shared/emailTemplate'),
  path.resolve(dirWithoutDist, '../emailTemplate'),
  path.resolve(__dirname, '../emailTemplate'),
];
const getAdminFrontendOrigin = () => {
  const rawUrl = String(config.adminClientUrl || '')
    .trim()
    .replace(/\/+$/, '');
  if (!rawUrl) return '';

  try {
    return new URL(rawUrl).origin;
  } catch {
    return `http://${rawUrl}`;
  }
};

const buildAdminFrontendUrl = (pathname: string, searchParams?: Record<string, string>) => {
  const origin = getAdminFrontendOrigin();
  const url = new URL(pathname, `${origin}/`);
  if (searchParams)
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

  return url.toString();
};

export const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test')
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch((error) =>
      logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env', {
        errorMessage: error instanceof Error ? error.message : String(error),
      }),
    );

const getEmailTransportErrorMeta = (error: unknown) => {
  if (!error || typeof error !== 'object') return {};

  const candidate = error as Record<string, unknown>;
  return {
    errorCode: typeof candidate.code === 'string' || typeof candidate.code === 'number' ? String(candidate.code) : undefined,
    command: typeof candidate.command === 'string' ? candidate.command : undefined,
    response: typeof candidate.response === 'string' ? candidate.response : undefined,
    responseCode: typeof candidate.responseCode === 'number' ? candidate.responseCode : undefined,
  };
};

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise<void>}
 */
export const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<void> => {
  const msg: Message = {
    from: config.email.from,
    to,
    subject,
    text,
    html,
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
export const sendResetPasswordEmail = async (to: string, token: string): Promise<void> => {
  const subject = 'Reset password';
  const resetPasswordUrl = buildAdminFrontendUrl('/reset-password', { token });
  const text = `Hi,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Dear user,</strong></h4>
  <p>To reset your password, click on this link: ${resetPasswordUrl}</p>
  <p>If you did not request any password resets, please ignore this email.</p>
  <p>Thanks,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendVerificationMail = async (to: string, token: string, name: string): Promise<void> => {
  const subject = 'Email Verification';
  const verificationEmailUrl = buildAdminFrontendUrl('/verify-email', { token });
  const text = `Hi ${name},
  To verify your email, click on this link: ${verificationEmailUrl}
  If you did not create an account, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>To verify your email, click on this link: ${verificationEmailUrl}</p>
  <p>If you did not create an account, then ignore this email.</p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send email verification after registration
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendSuccessfulRegistration = async (to: string, token: string, name: string): Promise<void> => {
  const subject = 'Email Verification';
  const verificationEmailUrl = buildAdminFrontendUrl('/verify-email', { token });
  const text = `Hi ${name},
  Congratulations! Your account has been created. 
  You are almost there. Complete the final step by verifying your email at: ${verificationEmailUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created.</p>
  <p>You are almost there. Complete the final step by verifying your email at: ${verificationEmailUrl}</p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send email verification after registration
 * @param {string} to
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendAccountCreated = async (to: string, name: string): Promise<void> => {
  const subject = 'Account Created Successfully';
  const loginUrl = buildAdminFrontendUrl('/');
  const text = `Hi ${name},
  Congratulations! Your account has been created successfully. 
  You can now login at: ${loginUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created successfully.</p>
  <p>You can now login at: ${loginUrl}</p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

export const sendNodeMailerEmail = async (toEmail: string, subject: string, htmlContent: string) => {
  const mailOptions = {
    from: config.email.from,
    to: toEmail,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info('Email sent successfully', { to: toEmail, subject });
  } catch (error) {
    logger.error('Failed to send email', {
      to: toEmail,
      subject,
      errorMessage: error instanceof Error ? error.message : 'Unknown email transport error',
      ...getEmailTransportErrorMeta(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error instanceof Error ? error : new Error('Unknown email transport error');
  }
};

const fallbackUserCredentialsTemplate = (replacements: Record<string, any>) => `
  <!DOCTYPE html>
  <html lang="en" style="font-family: Arial, sans-serif;">
    <head>
      <meta charset="UTF-8" />
      <title>Your Account Credentials</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        a.button {
          background-color: #dc4a1a;
          color: white !important;
          padding: 12px 20px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          font-weight: bold;
        }
        .container {
          max-width: 600px;
          margin: auto;
          padding: 24px;
          background-color: #ffffff;
          border: 1px solid #e8e8e8;
          border-radius: 10px;
        }
        .credential {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: monospace;
          word-break: break-word;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #888888;
          margin-top: 24px;
        }
      </style>
    </head>
    <body style="background-color: #f5f7fa; padding: 40px 0;">
      <div class="container">
        <h2 style="color: #dc4a1a;">Welcome to Pravass</h2>
        <p>Hello ${replacements.userName ?? 'User'},</p>
        <p>Your account has been created by the admin team. You can log in using the password below:</p>
        <div class="credential">${replacements.password ?? ''}</div>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${replacements.loginUrl ?? ''}" class="button">Login Now</a>
        </p>
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #555;">${replacements.loginUrl ?? ''}</p>
        <p style="margin-top: 30px;">Thank you,<br /><strong>The Pravass Team</strong></p>
      </div>
      <div class="footer">
        If you did not expect this email, please contact your administrator.
      </div>
    </body>
  </html>
`;

export const loadEmailTemplateFromFile = (templateName: string, replacements: any) => {
  const fileCandidates = templateSearchRoots.map((root) => path.join(root, `${templateName}.html`));
  const filePath = fileCandidates.find((candidate) => fs.existsSync(candidate));

  if (!filePath) {
    if (templateName === 'user-credentials') {
      logger.warn('Email template file missing, using inline fallback template', {
        templateName,
        candidates: fileCandidates,
      });
      return fallbackUserCredentialsTemplate(replacements);
    }

    throw new Error(`Email template file not found for template "${templateName}". Checked: ${fileCandidates.join(', ')}`);
  }

  const templateSource = fs.readFileSync(filePath, 'utf-8');
  const template = handlebars.compile(templateSource);
  return template(replacements);
};

export async function sendTemplatedEmail({
  to,
  subject,
  templateName,
  replacements,
}: {
  to: string;
  subject: string;
  templateName: string;
  replacements: Record<string, any>;
}): Promise<void> {
  const html = loadEmailTemplateFromFile(templateName, replacements);
  await sendNodeMailerEmail(to, subject, html);
}

export const sendUserCredentialsEmail = async (to: string, userName: string, password: string): Promise<void> => {
  await sendTemplatedEmail({
    to,
    subject: 'Your Pravass account credentials',
    templateName: 'user-credentials',
    replacements: {
      userName,
      password,
      loginUrl: buildAdminFrontendUrl('/'),
    },
  });
};
