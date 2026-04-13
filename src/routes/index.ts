import express, { Router } from 'express';

import authRoute from '@/modules/auth/auth.route.js';
import bannerRoute from '@/modules/banner/banner.route.js';
import mastersRoute from '@/modules/masters/masters.route.js';
import userRoute from '@/modules/user/user.route.js';
import supportRoute from '@/modules/support/support.route.js';

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
      path: '/masters',
      route: mastersRoute,
    },
    {
      path: '/banners',
      route: bannerRoute,
    },
    {
      path: '/support',
      route: supportRoute,
    },
  ];

  routes.forEach((route) => {
    router.use(route.path, route.route);
  });
};

setupRoutes();

export default router;
