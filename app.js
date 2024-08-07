import express from "express";
import { randomUUID } from 'crypto';
import { users, products, carts, orders } from './storage.js';
import bodyParser from "body-parser";
const app = express();

const PORT = 8080;
const HOST = 'localhost';

app.use(express.json());
app.use(bodyParser.json());





app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
})