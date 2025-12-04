import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware.js';
import { httpLogger } from './logger/httpLogger.js';
import { requestIdMiddleware } from './middlewares/request.middleware.js';
import cookieParser from 'cookie-parser';
import userRouter from './routes/users.routes.js';

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '16kb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '16kb',
  })
);
app.use(cookieParser());

app.use(httpLogger);
app.use(requestIdMiddleware);

app.use('/users', userRouter);

app.use(errorHandler);

export default app;
