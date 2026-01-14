import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware';
import { httpLogger } from './logger/httpLogger';
import { requestIdMiddleware } from './middlewares/request.middleware';
import cookieParser from 'cookie-parser';
import userRouter from './routes/users.routes';
import otpRouter from './routes/otp.routes';
import problemRoutes from '../src/routes/problem.routes'

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
app.use('/otp', otpRouter);

//problems
app.use('/api/problems', problemRoutes);

app.use(errorHandler);

export default app;
