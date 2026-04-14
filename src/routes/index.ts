import express, { Router } from 'express';

import authRoute from '@/modules/auth/auth.route.js';
import mastersRoute from '@/modules/masters/masters.route.js';
import permissionRoute from '@/modules/permissions/permission.route.js';
import roleRoute from '@/modules/roles/role.route.js';
import userRoute from '@/modules/user/user.route.js';
import s3Route from '@/shared/core/s3/s3.route.js';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const setupRoutes = () => {
  const routes: IRoute[] = [
    {
      path: '/auth',
      route: authRoute,
    },
    {
      path: '/users',
      route: userRoute,
    },
    {
      path: '/permissions',
      route: permissionRoute,
    },
    {
      path: '/roles',
      route: roleRoute,
    },
    {
      path: '/masters',
      route: mastersRoute,
    },
    {
      path: '/upload',
      route: s3Route,
    },
  ];

  routes.forEach((route) => {
    router.use(route.path, route.route);
  });
};

setupRoutes();

export default router;
