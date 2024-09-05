import express from "express";
import fs from "fs";
import path from "path";
import EventEmitter from "events";

import { randomUUID } from 'crypto';
import { users, products, carts, orders } from './storage.js';
import { CustomError } from "./errorHandler.js";
import { isAuth } from "./middlewares.js";
import { fileURLToPath } from "url";
import { validateData } from "./validation.js";
import { logToFile } from "./logToFile.js";


const app = express();
app.use(express.json());

const events = new EventEmitter();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const PORT = 8080;
// const HOST = 'localhost';






app.post('/register', validateData, (req, res) => {

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

// new product

app.post('/product', (req, res) => {
  const id = randomUUID();
  const newProduct = {
    id: id,
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    images: [],
    video: []
  };
  const data = JSON.stringify(newProduct);
  fs.writeFile('products.store.json', data, (err) => {
    if (err) {
      throw new CustomError(401, "Product not found!")
    }
  })
  res.status(200).send(newProduct);
})

//

app.post('/product/:id/image/upload', (req, res) => {

  const imageName = randomUUID();
  const filePath = path.join(__dirname, 'images', `${imageName}.jpg`)
  const imageStream = fs.createWriteStream(filePath);

  imageStream.on('fileUploadStart', () => {
    events.emit('File upload has started')
    logToFile('File upload has started');
  })
  req.pipe(imageStream);

  imageStream.on('fileUploadEnd', () => {
    events.emit('File has been uploaded')
    logToFile('File has been uploaded');
  })

  imageStream.on('fileUploadFailed', () => {
    events.emit('File write error')
    logToFile('File write error');
  })

  fs.readFile('./products.store.json', 'utf8', (err, data) => {
    if (err) {
      throw new CustomError(401, "Ошибка чтения json файла");
    }

    const product = JSON.parse(data);
    product.images.push(`${imageName}.jpg`);
    const productData = JSON.stringify(product);
    fs.writeFile('products.store.json', productData, (err) => {
      if (err) {
        throw new CustomError(401, "Ошибка записи файла");
      }
      res.status(200).send(productData);
    });

  });
  
})

app.post('/product/:id/video/upload', (req, res) => {

  const imageName = randomUUID();
  const filePath = path.join(__dirname, 'video', `${imageName}.mp4`)
  const imageStream = fs.createWriteStream(filePath);

  imageStream.on('fileUploadStart', () => {
    events.emit('File upload has started')
    logToFile('File upload has started');
  })

  req.pipe(imageStream);

  imageStream.on('fileUploadEnd', () => {
    events.emit('File has been uploaded')
    logToFile('File has been uploaded');
  })

  imageStream.on('fileUploadFailed', () => {
    events.emit('File write error')
    logToFile('File write error');
  })


  fs.readFile('./products.store.json', 'utf8', (err, data) => {
    if (err) {
      throw new CustomError(401, "Ошибка записи json файла");
    }
    const product = JSON.parse(data);
    
    product.video.push(`${imageName}.mp4`);
    const productData = JSON.stringify(product);
    fs.writeFile('products.store.json', productData, (err) => {
      if (err) {
        throw new CustomError(401, "Ошибка записи файла");
      }
      res.status(200).send(productData);
    });

  });
  
})


app.get('/product/image/:fileName', (req, res) => {
  const { fileName } = req.params;
  const imagePath = path.join(__dirname, 'images', fileName);
  const imageStream = fs.createReadStream(imagePath);

  imageStream.on('fileUploadStart', () => {
    events.emit('File upload has started')
    logToFile('File upload has started');
  })
  imageStream.pipe(res);

  imageStream.on('fileUploadEnd', () => {
    events.emit('File has been uploaded')
    logToFile('File has been uploaded');
  })

  imageStream.on('fileUploadFailed', () => {
    events.emit('File write error')
    logToFile('File write error');
  })
})

app.get('/product/video/:fileName', (req, res) => {
  const { fileName } = req.params;
  const videoPath = path.join(__dirname, 'video', fileName);
  const videoStream = fs.createReadStream(videoPath);
  
  imageStream.on('fileUploadStart', () => {
    events.emit('File upload has started')
    logToFile('File upload has started');
  })
  videoStream.pipe(res);

  imageStream.on('fileUploadEnd', () => {
    events.emit('File has been uploaded')
    logToFile('File has been uploaded');
  })

  imageStream.on('fileUploadFailed', () => {
    events.emit('File write error')
    logToFile('File write error');
  })
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

