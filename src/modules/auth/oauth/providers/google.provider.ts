import config from '@/shared/config/config.js';
import { OAuth2Client } from 'google-auth-library';

const googleProvider = config.google;
const client = new OAuth2Client(googleProvider.clientId);

export const verifyGoogleToken = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: googleProvider.clientId,
  });

  const payload = ticket.getPayload();

  if (!payload) throw new Error('Invalid token');

  return {
    providerId: payload.sub!,
    email: payload.email!,
    name: payload.name,
    picture: payload.picture,
  };
};
