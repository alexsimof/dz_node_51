import { Router } from "express";
import { randomUUID } from "crypto";
import { validateData } from "../validation.js";
import { users } from '../storage.js';


const router = Router();

router.post('/register', validateData, (req, res) => {

  const userId = randomUUID();
  const newUser = {
    id: userId,
    email: req.body.email,
    pass: req.body.password
  }
  res.set({'x-user-id': userId})
  users.push(newUser);
  res.status(201).send(newUser);

});

export default router;