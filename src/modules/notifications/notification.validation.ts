import Joi from 'joi';

export const registerToken = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    clientType: Joi.string().valid('website', 'admin').required(),
  }),
};

export const sendNotification = {
  body: Joi.object().keys({
    title: Joi.string().required().max(100),
    message: Joi.string().required().max(500),
    target: Joi.string().valid('internal', 'external').required(),
    scheduledFor: Joi.date().iso().optional(),
    expiresAt: Joi.date().iso().optional(),
    data: Joi.object().optional(),
  }),
};

export const getNotifications = {
  query: Joi.object().keys({
    target: Joi.string().valid('internal', 'external'),
    status: Joi.string().valid('pending', 'processing', 'sent', 'failed', 'cancelled', 'completed'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().required(),
  }),
};

export const deleteNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().required(),
  }),
};
