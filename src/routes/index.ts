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
import testimonialRoute from '@/modules/testimonial/testimonial.route.js';
import s3Route from '@/shared/core/s3/s3.route.js';
import supportRoute from '@/modules/support/support.route.js';
import tourRoute from '@/modules/tours/tour.route.js';
import specialityTourRoute from '@/modules/specialityTours/specialityTour.route.js';
import dealRoute from '@/modules/deals/deal.route.js';
import leadRoute from '@/modules/leads/lead.route.js';
import customerRoute from '@/modules/customers/customer.route.js';
import notificationRoute from '@/modules/notifications/notification.route.js';

import bookingRoute from '@/modules/bookings/booking.route.js';
import homepageRoute from '@/modules/homepage/homepage.route.js';
import transactionRoute from '@/modules/transactions/transaction.route.js';

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
      path: '/testimonials',
      route: testimonialRoute,
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
    {
      path: '/tours',
      route: tourRoute,
    },
    {
      path: '/speciality-tours',
      route: specialityTourRoute,
    },
    {
      path: '/deals',
      route: dealRoute,
    },
    {
      path: '/leads',
      route: leadRoute,
    },
    {
      path: '/customers',
      route: customerRoute,
    },
    {
      path: '/bookings',
      route: bookingRoute,
    },
    {
      path: '/notifications',
      route: notificationRoute,
    },
    {
      path: '/homepage',
      route: homepageRoute,
    },
    {
      path: '/transactions',
      route: transactionRoute,
    },
  ];

  routes.forEach((route) => {
    router.use(route.path, route.route);
  });
};

setupRoutes();

export default router;
