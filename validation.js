import Joi from 'joi';
import { CustomError } from "./errorHandler.js";

const signUpBodySchema = Joi.object({
  email: Joi.string().min(2).email().required(),

  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]')),
});

export const validateData = (req, res, next) => {
  const { error } = signUpBodySchema.validate(req.body);
  if(error) {
    throw new CustomError(error)
  }
  next();
}