import crypto from 'node:crypto';

import { generateAuthTokens } from '@/modules/token/token.service.js';
import { getUserByEmail, registerUser } from '@/modules/user/user.service.js';
import { OAUTH_PARAMETER } from '../oauth.interface.js';
import { verifyOAuthToken } from '../providers/oauth.factory.js';

export const oauthLogin = async ({ provider, token }: OAUTH_PARAMETER) => {
  const oauthUser = await verifyOAuthToken({ provider, token });

  let user = await getUserByEmail(oauthUser.email);

  if (!user) {
    user = await registerUser({
      email: oauthUser.email,
      name: oauthUser.name || '',
      password: crypto.randomBytes(24).toString('hex'),
      providers: [
        {
          name: provider,
          providerId: oauthUser.providerId,
        },
      ],
    });
  } else {
    const linked = user.providers && user.providers.some((p) => p.name === provider);

    if (!linked) {
      user.providers &&
        user.providers.push({
          name: provider,
          providerId: oauthUser.providerId,
        });

      await user.save();
    }
  }

  const tokens = await generateAuthTokens(user);
  return { user, tokens };
};
