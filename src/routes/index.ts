import  authRoute  from '@/modules/auth/auth.route.js';
import  userRoute from '@/modules/user/user.route.js';
import express, { Router } from 'express';


const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
