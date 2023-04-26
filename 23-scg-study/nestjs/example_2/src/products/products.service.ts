import { BadRequestException, HttpException, Injectable, MethodNotAllowedException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private products: Product[] = [];
  private primaryKey = 1;

  create(createProductDto: CreateProductDto) {
    const product = new Product();
    product.id = this.primaryKey++;
    product.name = createProductDto.name;
    product.price = createProductDto.price;
    product.description = createProductDto.description;
    product.createdAt = new Date();
    product.updatedAt = product.createdAt;
    product.isLocked = false;

    this.products.push(product);
    return product;
  }

  findAll() {
    return this.products;
  }

  findOne(id: number) {
    const product = this.products.find((product) => product.id === id);

    if(!product) {
      throw new BadRequestException("Cannot Find Product");
    }

    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    const product = this.findOne(id);

    if (product.isLocked) {
      throw new HttpException("Product Is Locked", 423);
    }

    product.name = updateProductDto.name ?? product.name;
    product.price = updateProductDto.price ?? product.price;
    product.description = updateProductDto.description ?? product.description;
    product.updatedAt = new Date();
    product.isLocked = updateProductDto.isLocked ?? product.isLocked;

    return product;
  }

  remove(id: number) {
    const product = this.findOne(id);
    this.products.splice(this.products.indexOf(product), 1);
  }
}

