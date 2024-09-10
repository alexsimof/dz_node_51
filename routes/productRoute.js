import fs from "fs";
import path from "path";
import EventEmitter from "events";

import { Router } from "express";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { products } from '../storage.js';
import { CustomError } from "../errorHandler.js";
import { logToFile } from "../logToFile.js";
import { writeProductFile } from "../writeProductFile.js";


const router = Router();
const streamEvents = new EventEmitter();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


streamEvents.on('fileUploadStart', () => {
  logToFile('File upload has started');
});

streamEvents.on('fileUploadEnd', () => {
  logToFile('File has been uploaded');
});

streamEvents.on('fileUploadFailed', () => {
  logToFile('File write error');
});

// 

router.get('/products', (req, res) => {
  res.status(200).send(products);
});

router.get('/products/:id', (req, res) => {

  const product = products.find(p => p.id == req.params.id )
  if (!product) {
    throw new CustomError(404, "Product not found!");
  }

  res.status(200).send(product);
});


// new product


router.post('/product', (req, res) => {
  const id = randomUUID();
  const newProduct = {
    id: id,
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    images: [],
    video: []
  };
  writeProductFile(newProduct);
  res.status(200).send(newProduct);
})


// image upload

router.post('/product/:id/image/upload', (req, res) => {

  const imageName = randomUUID();
  const filePath = path.join(__dirname, 'images', `${imageName}.jpg`)
  const imageStream = fs.createWriteStream(filePath);

  streamEvents.emit('fileUploadStart')

  req.pipe(imageStream);

  imageStream.and('fileUploadEnd', () => {
    streamEvents.emit('File has been uploaded')
  });

  imageStream.on('error', () => {
    streamEvents.emit('File write error')
  })

  fs.readFile('./products.store.json', 'utf8', (err, data) => {
    if (err) {
      throw new CustomError(401, "Ошибка чтения json файла");
    }

    const product = JSON.parse(data);
    product.images.push(`${imageName}.jpg`);

    writeProductFile(product);
    res.status(200).send(product);
  });
});


// video upload

router.post('/product/:id/video/upload', (req, res) => {

  const imageName = randomUUID();
  const filePath = path.join(__dirname, 'video', `${imageName}.mp4`)
  const imageStream = fs.createWriteStream(filePath);

  streamEvents.emit('fileUploadStart')

  req.pipe(imageStream);

  imageStream.and('fileUploadEnd', () => {
    streamEvents.emit('File has been uploaded')
  });

  imageStream.on('error', () => {
    streamEvents.emit('File write error')
  });

  fs.readFile('./products.store.json', 'utf8', (err, data) => {
    if (err) {
      throw new CustomError(401, "Ошибка записи json файла");
    }
    const product = JSON.parse(data);
    product.video.push(`${imageName}.mp4`);

    writeProductFile(product);
    res.status(200).send(product);
  });
})


router.get('/product/image/:fileName', (req, res) => {
  const { fileName } = req.params;
  const imagePath = path.join(__dirname, 'images', fileName);
  const imageStream = fs.createReadStream(imagePath);

  streamEvents.emit('fileUploadStart');

  imageStream.pipe(res);

  imageStream.and('fileUploadEnd', () => {
    streamEvents.emit('File has been uploaded')
  });

  imageStream.on('error', () => {
    streamEvents.emit('File write error')
  });
})


router.get('/product/video/:fileName', (req, res) => {
  const { fileName } = req.params;
  const videoPath = path.join(__dirname, 'video', fileName);
  const videoStream = fs.createReadStream(videoPath);
  
  streamEvents.emit('fileUploadStart');

  videoStream.pipe(res);

  imageStream.and('fileUploadEnd', () => {
    streamEvents.emit('File has been uploaded')
  });

  imageStream.on('error', () => {
    streamEvents.emit('File write error')
  });
})


export default router;