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

  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).send({ error: 'Product not found' });

  const cart = carts.find(cart => cart.userId === userId)

  if (!cart) {
    const userProducts = [];
    userProducts.push(product);
    const cart = {
      cartId: randomUUID(),
      userId: userId,
      userProducts
    };
    carts.push(cart)
    res.status(200).send(carts);
  } else {
    cart.userProducts.push(product);
    res.status(200).send(carts);
  }

})

app.delete('/cart/:id', (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId || !users.find(u => u.id === userId)) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const cart = carts.find(c => c.userId === userId)
  if (!cart) return res.status(404).send({ error: 'Cart not found' });

  const productIndex = cart.userProducts.findIndex(p => p.id == req.params.id);
  if (productIndex === -1) return res.status(404).send({ error: "Product not found in cart"})

  cart.userProducts.splice(productIndex, 1);
  res.status(200).send(carts);

})

app.post('/cart/checkout', (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId || !users.find(u => u.id === userId)) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const cart = carts.find(c => c.userId === userId);
  if (!cart) return res.status(404).send({ error: 'Cart not found' });

  const order = {};
  const orderId = randomUUID();
  const totalPrice = cart.userProducts.reduce((acc, curr) => acc + curr.price, 0);

  if (order) {
    order.id = orderId;
    order.userId = userId;
    order.products = cart.userProducts;
    order.price = totalPrice;

    // res.status(200).send(order)
    orders.push(order);
    res.status(200).send(orders)
  }

})


app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
})

