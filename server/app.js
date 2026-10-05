// Assembles the API Gateway Layer (SAD 3.4): the order of this middleware chain is the design.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const pinoHttp = require('pino-http');
const config = require('./config/env');
const logger = require('./config/logger');
const requestId = require('./middleware/requestId');
const { globalLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { E } = require('./utils/AppError');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind the host's TLS-terminating proxy

  // SR-02: permanent redirect to HTTPS in production.
  if (config.isProd) {
    app.use((req, res, next) => (req.secure ? next() : res.redirect(301, `https://${req.get('host')}${req.originalUrl}`)));
  }

  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => req.id, autoLogging: !config.isTest }));
  app.use(helmet({ hsts: { maxAge: 15552000, includeSubDomains: true } })); // SR-02, SR-07 (CSP)
  app.use(cors({ origin: config.clientOrigin, credentials: true })); // explicit allow-list (SRS 3.3)
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize()); // strips $ and . keys (SR-07)
  app.use(globalLimiter);

  app.use('/api/v1', routes);
  app.use((req, res, next) => next(E.notFound('ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}`)));
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
