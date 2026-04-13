import express, { Router } from 'express';

import authRoute from '@/modules/auth/auth.route.js';
import blogRoute from '@/modules/blog/blog.route.js';
import faqRoute from '@/modules/faq/faq.route.js';
import mastersRoute from '@/modules/masters/masters.route.js';
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
    {
      path: '/masters',
      route: mastersRoute,
    },
    {
      path: '/blogs',
      route: blogRoute,
    },
    {
      path: '/faqs',
      route: faqRoute,
    },
  ];

  routes.forEach((route) => {
    router.use(route.path, route.route);
  });
};

setupRoutes();

export default router;
