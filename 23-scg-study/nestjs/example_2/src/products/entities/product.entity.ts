import { Exclude } from "class-transformer";

export class Product {
  id: number;
  name: string;
  price: number;
  description: string;
  
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  isLocked: boolean;
}
