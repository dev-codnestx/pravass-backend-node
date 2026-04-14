import express, { Router } from 'express';

import authRoute from '@/modules/auth/auth.route.js';
import blogRoute from '@/modules/blog/blog.route.js';
import applicationRoute from '@/modules/careers/application.route.js';
import jobRoute from '@/modules/careers/job.route.js';
import faqRoute from '@/modules/faq/faq.route.js';
import bannerRoute from '@/modules/banner/banner.route.js';
import mastersRoute from '@/modules/masters/masters.route.js';
import permissionRoute from '@/modules/permissions/permission.route.js';
import roleRoute from '@/modules/roles/role.route.js';
import userRoute from '@/modules/user/user.route.js';
import s3Route from '@/shared/core/s3/s3.route.js';
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
    {
      path: '/blogs',
      route: blogRoute,
    },
    {
      path: '/faqs',
      route: faqRoute,
    },
    {
      path: '/jobs',
      route: jobRoute,
    },
    {
      path: '/applications',
      route: applicationRoute,
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
