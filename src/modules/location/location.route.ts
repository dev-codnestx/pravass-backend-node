import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';

import { capitalize } from '@/shared/utils/commonHelper.js';
import validate from '@/shared/utils/middlewares/validate.middleware.js';
import { locationValidation } from '@/shared/validations/index.js';

const router: Router = express.Router();

// Middleware to dynamically attach correct validation
function dynamicValidation(action: 'get' | 'create' | 'update' | 'delete'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.params;
    if (!type) return next(new Error('Type parameter is required'));

    const capitalType = capitalize(type);
    console.info('🚀 ~ return ~ capitalType:', capitalType);
    const validationKey = `${action}${capitalType}`;

    console.info('🚀 ~ return ~ validationKey:', validationKey);
    const validationSchema = locationValidation.validate[validationKey];

    if (!validationSchema) {
      console.warn('Missing key:', validationKey);
      // ✅ instead of returning response directly, use `next()` with an error
      return next(new Error(`Invalid type: ${type}`));
    }

    // ✅ call validate() and immediately return the result
    return validate(validationSchema)(req, res, next);
  };
}

// Example route using GET (read)
router.route('/:type').get(dynamicValidation('get'), (_req, res) => {
  res.send('Validation passed, proceed to controller logic...');
});

export default router;
