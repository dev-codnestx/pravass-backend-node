import { OAUTH_PARAMETER } from '../oauth.interface.js';
import { verifyGoogleToken } from './google.provider.js';

export const verifyOAuthToken = async ({ provider, token }: OAUTH_PARAMETER) => {
  if (provider === 'google') return verifyGoogleToken(token);

  throw new Error('Unsupported provider');
};
