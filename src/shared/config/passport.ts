import { Request } from 'express';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';

import { IPayload } from '@/modules/token/token.interfaces.js';
import tokenTypes from '@/modules/token/token.types.js';
import User from '@/modules/user/user.model.js';
import config from '@/shared/config/config.js';

const cookieExtractor = (req: Request) => {
  let token = null;
  if (req && req.cookies) token = req.cookies['token'];
  return token;
};

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
  },
  async (payload: IPayload, done) => {
    try {
      if (payload.type !== tokenTypes.ACCESS) throw new Error('Invalid token type');

      const user = await User.findById(payload.sub);
      if (!user) return done(null, false);

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  },
);

export default jwtStrategy;
