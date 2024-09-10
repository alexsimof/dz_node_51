
import { Router } from "express";
import { randomUUID } from "crypto";
import { CustomError } from "../errorHandler.js";
import { isAuth } from "../middlewares.js";
import { products, carts, orders } from '../storage.js';

const router = Router();



router.put('/cart/:id', isAuth, (req, res) => {

  const product = products.find(p => p.id == req.params.id);
  if (!product) {
    throw new CustomError(404, "Product not found!");
  }

  const userId = req.userId;
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

});

router.delete('/cart/:id', isAuth, (req, res) => {
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

});

router.post('/cart/checkout', isAuth, (req, res) => {
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

});

export default router;