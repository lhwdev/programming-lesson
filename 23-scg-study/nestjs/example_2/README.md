# 27th-nest-study
27기 신입 NestJS 스터디

* Node.js 18.x

실습1 순서:

1. nest new ~~~
2. nest generate resource products // module, service 각각 따로 생성하기
3. npm i --save class-validator class-transformer // class-validator class-transformer 설치
4. Entity 생성, DTO 구현, create API 구현
5. findAll, findOne API 구현
6. update API 구현
7. remove API 구현
8. npm run test 테스트 통과

실습2 순서:

1. npm install --save @prisma/client prisma
2. npx prisma init
3. npx prisma generate
4. npx prisma validate, npx prisma db push (npx prisma migration dev)
5. nest g module prisma, nest g service prisma
6. Prisma 코드 설정
7. Prisma를 통해 ProductService 구현
8. npm run test 테스트 통과