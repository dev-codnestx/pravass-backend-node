import express, { Router } from 'express';

import authRoute from '@/modules/auth/auth.route.js';
import userRoute from '@/modules/user/user.route.js';

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
  ];

  routes.forEach((route) => {
    router.use(route.path, route.route);
  });
};

setupRoutes();

export default router;
