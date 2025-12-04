import express from 'express';
import cors from "cors";
import { errorHandler } from './middlewares/error.middleware';
import { httpLogger } from './logger/httpLogger';
import {requestIdMiddleware} from './middlewares/request.middleware'
import { ApiError } from './utils/api-errors';



const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(","),
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders:["Content-Type","Authorization"]
})
);

app.use(express.json({limit:"16kb"}));
app.use(
  express.urlencoded({
    extended:true,
    limit:"16kb",
  })
)

app.use(httpLogger);
app.use(requestIdMiddleware)



app.get('/', (req, res) => {
  throw new ApiError(500,"SOmehting went wrong")
});


app.use(errorHandler);

export default app;
