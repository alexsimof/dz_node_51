import express from "express";
import { CustomError } from "./errorHandler.js";
const app = express();
app.use(express.json());

export function isAuth(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId || !users.find(u => u.id === userId)) {
    throw new CustomError(401, "Unauthorized")
  }
  // res.locals = userId;
  next();
};