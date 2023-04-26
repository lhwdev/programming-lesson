import { BadRequestException, HttpException, Injectable } from "@nestjs/common";
import { Product } from "./entities/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  private products: Product[] = [];
  private primaryKey = 1;

  create(data: CreateProductDto) {
    const product = new Product();


    product.id = this.primaryKey++;
    product.name = data.name;
    product.price = data.price;
    product.description = data.description;
    product.createdAt = new Date();
    product.updatedAt = product.createdAt;
    product.isLocked = false;

    this.products.push(product);
    return product;
  }

  list() {
    return this.products;
  }

  find(id: number) {
    const product = this.products.find(product => product.id === id);
    if (!product) {
      throw new BadRequestException("Cannot find product");
    }
    return product;
  }

  update(id: number, update: UpdateProductDto) {
    const product = this.find(id);

    if (product.isLocked) {
      throw new HttpException("Product is locked", 423);
    }

    Object.assign(product, update);
    product.updatedAt = new Date();

    return product;
  }

  remove(id: number) {
    const product = this.find(id);
    this.products.splice(this.products.indexOf(product), 1);
  }
}
