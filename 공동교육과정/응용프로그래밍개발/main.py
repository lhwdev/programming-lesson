print(1, 2, 3, 4, 5)
print("안녕하세요", "제", "이름은", "이현우입니다")

print('hello, world!')
print('hello, "woow"! nice \'text\'!')

print('''\
동해물과 백두산이 마르고 닮도록
하느님이 보우하사 우리나라 만세\
''')

print(f'hello, {1 + 3}!')


print('안녕하세요'[0:2])
print('{} {} {}'.format(1, 'hi', True))
print(f'{1}, {"hi"}, {True}')

# integers
print('{:d}'.format(52))

# width constrains
print('{:5d}'.format(52))

print('{:010d}'.format(-52))

print('%d! 우와' % 123)


