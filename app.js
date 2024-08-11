import express from "express";
import { randomUUID } from 'crypto';
import { users, products, carts, orders } from './storage.js';
import bodyParser from "body-parser";
const app = express();

const PORT = 8080;
const HOST = 'localhost';

app.use(express.json());
app.use(bodyParser.json());


app.post('/register', (req, res) => {
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
  if (!product) return res.status(404).send("Product not found!")
  res.status(200).send(product);
});

app.put('/cart/:id', (req, res) => {

  const userId = req.header('x-user-id');
  if (!userId || !users.find(u => u.id === userId)) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  if (!carts.userId) {
    carts.userId = [];
  }

  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).send({ error: 'Product not found' });

  carts.userId.push(product);
  res.status(200).send(carts.userId);

})

app.delete('/cart/:id', (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId || !users.find(u => u.id === userId)) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const cart = carts.userId;
  if (!cart) return res.status(404).send({ error: 'Cart not found' });

  const productIndex = cart.findIndex(p => p.id == req.params.id);
  if (productIndex === -1) return res.status(404).send({ error: "Product not found in cart"})

  cart.splice(productIndex, 1);
  res.status(200).send(cart);

})

app.post('/cart/checkout', (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId || !users.find(u => u.id === userId)) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const cart = carts.userId;
  if (!cart || cart.length === 0) return res.status(400).send({ error: 'Cart is empty' });

  const orderId = randomUUID();
  const totalPrice = cart.reduce((acc, curr) => acc + curr.price, 0);
  orders.orderId = { userId, orderId, totalPrice, items: cart };
  carts.userId = [];

  res.status(201).send(orders.orderId);

})


app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
})

