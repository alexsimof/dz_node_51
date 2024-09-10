import fs from "fs";

export const writeProductFile = (newProduct) => {
  const data = JSON.stringify(newProduct);
  fs.writeFile('products.store.json', data, (err) => {
    if (err) {
      throw new CustomError(401, "Product not found!")
    }
  })
}