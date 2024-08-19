import express from "express";
import { randomUUID } from 'crypto';
import { users, products, carts, orders } from './storage.js';
import { CustomError } from "./errorHandler.js";
import { body, validationResult } from "express-validator";
import bodyParser from "body-parser";
const app = express();

// const PORT = 8080;
// const HOST = 'localhost';

app.use(express.json());
app.use(bodyParser.json());


function isAuth(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId || !users.find(u => u.id === userId)) {
    throw new CustomError(401, "Unauthorized")
  }
  res.locals = userId;
  next();
};


app.post('/register', [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ], (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    return res.status(400).json({ errors: errors.array() });
  }

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

app.get('/products', (req, res) => {
  res.status(200).send(products);
});

app.get('/products/:id', (req, res) => {

  const product = products.find(p => p.id == req.params.id )
  if (!product) {
    throw new CustomError(404, "Product not found!");
  }

  res.status(200).send(product);
});


app.put('/cart/:id', isAuth, (req, res) => {

  const product = products.find(p => p.id == req.params.id);
  if (!product) {
    throw new CustomError(404, "Product not found!");
  }

  const userId = res.locals;
  const cart = carts.find(cart => cart.userId === userId);

  if (!cart) {
    const userProducts = [];
    userProducts.push(product);
    const cart = {
      cartId: randomUUID(),
      userId,
      userProducts
    }
    carts.push(cart)
    res.status(200).send(cart);
  } else {
    cart.userProducts.push(product);
    res.status(200).send(carts);
  }

})

app.delete('/cart/:id', isAuth, (req, res) => {
  const userId = res.locals;
  const cart = carts.find(c => c.userId === userId)
  if (!cart) {
    throw new CustomError(404, "Cart not found!");
  }

  const productIndex = cart.userProducts.findIndex(p => p.id == req.params.id);
  if (productIndex === -1) {
    throw new CustomError(404, "Product not found in cart");
  }

  cart.userProducts.splice(productIndex, 1);
  res.status(200).send(carts);

})

app.post('/cart/checkout', isAuth, (req, res) => {
  const userId = res.locals;
  const cart = carts.find(c => c.userId === userId);
  if (!cart) {
    throw new CustomError(404, "Cart not found")
  }

  const order = {};
  const orderId = randomUUID();
  const totalPrice = cart.userProducts.reduce((acc, curr) => acc + curr.price, 0);

  if (order) {
    order.id = orderId;
    order.userId = userId;
    order.products = cart.userProducts;
    order.price = totalPrice;

    orders.push(order);
    res.status(200).send(orders)
  }

})

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: `Error: ${err.message}`
  });
  next();
})

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://${process.env.HOST}:${process.env.PORT}/`);
})

