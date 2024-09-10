import express from "express";

import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";

const app = express();
app.use(express.json());

app.use('/', userRoute);
app.use('/', productRoute);
app.use('/', cartRoute);

//

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: `Error: ${err.message}`
  });
  next();
})

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://${process.env.HOST}:${process.env.PORT}/`);
})

