import express from 'express';
import cors from "cors";
import { errorHandler } from './middlewares/error.middleware';


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

app.get('/', (req, res) => {
  res.send('Hello, World!');
});


app.use(errorHandler);

export default app;
