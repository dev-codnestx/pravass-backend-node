import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

import routes from '@/routes/index.js';
import config from '@/shared/config/config.js';
import jwtStrategy from '@/shared/config/passport.js';
import { ApiError, errorConverter, errorHandler } from '@/shared/utils/errors/index.js';
import { authLimiter } from '@/shared/utils/index.js';
import { responseMiddleware } from '@/shared/utils/response.js';

const app: Express = express();

// set security HTTP headers
// app.use(helmet());

// enable cors
app.use(
  cors({
    origin: config.clientUrl, // Use specific client URL from config
    credentials: true,
  }),
);
// app.options('*', cors());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// parse cookies
app.use(cookieParser());

// sanitize request data
// app.use(ExpressMongoSanitize());

// gzip compression
app.use(compression());

// standard API response helpers
app.use(responseMiddleware);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') app.use('/v1/auth', authLimiter);

app.get('/', (_req, res) => {
  res.success(null, 0, 'Welcome to the API!!');
});

// health check
app.get('/health', (_req, res) => {
  res.success(null, 0, 'API is running!!');
});

// v1 api routes
app.use('/api/v1', routes);

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
