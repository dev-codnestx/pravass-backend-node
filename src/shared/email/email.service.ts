import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

import config from '@/shared/config/config.js';
import { Message } from '@/shared/email/email.interfaces.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirWithoutDist = __dirname.includes('dist') ? __dirname.replace(/dist/, '') : __dirname;

export const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test')
  transport
    .verify()
    .then(() => console.info('Connected to email server'))
    .catch(() => console.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));

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
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://${config.clientUrl}/reset-password?token=${token}`;
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
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://${config.clientUrl}/verify-email?token=${token}`;
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
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://${config.clientUrl}/verify-email?token=${token}`;
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
  // replace this url with the link to the email verification page of your front-end app
  const loginUrl = `http://${config.clientUrl}/auth/login`;
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
    console.log('Email sent successfully to', toEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const loadEmailTemplateFromFile = (templateName: string, replacements: any) => {
  const emailTemplatePath = config.env === 'development' ? '../emailTemplate' : 'src/shared/emailTemplate';
  const filePath = path.join(dirWithoutDist, emailTemplatePath, `${templateName}.html`);
  const templateSource = fs.readFileSync(filePath, 'utf-8');
  const template = handlebars.compile(templateSource);
  const renderedTemplate = template(replacements);
  return renderedTemplate;
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
      loginUrl: `http://${config.clientUrl}/auth/login`,
    },
  });
};
