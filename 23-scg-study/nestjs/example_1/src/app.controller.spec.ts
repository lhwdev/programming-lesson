import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClassSerializerInterceptor, HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ProductsModule } from './products/products.module';
import { Reflector } from '@nestjs/core';
// import { PrismaModule } from './prisma/prisma.module';

describe('AppController', () => {
  let app: INestApplication;
  let appController: AppController;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      // imports: [ProductsModule, PrismaModule],
      imports: [ProductsModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = testingModule.get<AppController>(AppController);
    app = await testingModule.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('서버 실행 후 "Hello World!"가 나타난다.', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/products (POST)', () => {
    it('제품의 이름은 2~20글자이다.', async () => {
      const payload = {
        name: '1',
        price: 1000,
      };
      const response = await request(app.getHttpServer())
        .post('/products')
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual([
        "name must be longer than or equal to 2 characters"
      ]);

      const payload2 = {
        name: '012345678901234567890',
        price: 1000,
      };
      const response2 = await request(app.getHttpServer())
        .post('/products')
        .send(payload2)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response2.body.message).toEqual([
        "name must be shorter than or equal to 20 characters"
      ]);
    });

    it('제품의 가격은 양의 정수이다.', async () => {
      const payload = {
        name: 'test',
        price: -1000,
      };
      const response = await request(app.getHttpServer())
        .post('/products')
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual([
        "price must be a positive number"
      ]);

      const payload2 = {
        name: 'test',
        price: "test",
      };
      const response2 = await request(app.getHttpServer())
        .post('/products')
        .send(payload2)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response2.body.message).toEqual([
        "price must be a positive number",
        "price must be an integer number"
      ]);

      const payload3 = {
        name: 'test',
        price: 3.14,
      };
      const response3 = await request(app.getHttpServer())
        .post('/products')
        .send(payload3)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response3.body.message).toEqual([
        "price must be an integer number"
      ]);
    });
  });
  
  describe('/products (GET)', () => {
    it('findOne: 올바르지 id로 제품을 조회하면 BadRequestException을 던진다', async () => {
      const payload = {
        name: 'name',
        price: 1000,
        description: "description"
      };

      await request(app.getHttpServer())
        .post('/products')
        .send(payload)
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get('/products/test')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual(
        "Validation failed (numeric string is expected)"
      );

      const response2 = await request(app.getHttpServer())
        .get('/products/100')
        .expect(HttpStatus.BAD_REQUEST);
        
      expect(response2.body.message).toEqual(
        "Cannot Find Product"
      );
    });
  });
});