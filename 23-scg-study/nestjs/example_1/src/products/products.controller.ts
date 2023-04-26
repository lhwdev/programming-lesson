import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  create(@Body() data: CreateProductDto) {
    return this.products.create(data);
  }

  @Get()
  list() {
    return this.products.list();
  }

  @Get(":id")
  find(@Param("id", ParseIntPipe) id: number) {
    return this.products.find(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() update: UpdateProductDto,
  ) {
    return this.products.update(id, update);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.products.remove(id);
  }
}
