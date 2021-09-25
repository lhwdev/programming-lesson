# To add a new cell, type '# %%'
# To add a new markdown cell, type '# %% [markdown]'
# %% [markdown]
# # 3일차
# %% [markdown]
# ## 반복문/리스트

# %%
a = [1, 2, 3, 4, 5]
a.append(6)
print(a)
a[1:3]


# %%
aa = []
length = int(input('길이: '))

for i in range(0, length):
  aa.append(int(input(f'{i}번째 항목:')))

print(sum(aa))


# %%
aa = []
bb = []
value = 0

for i in range(0, 100):
  aa.append(value)
  value += 2

for i in range(0, 100):
  bb.append(aa[99 - i])

print(f'bb[0] = {bb[0]}, bb[99] = {bb[99]}')


# %%
myList = [30, 10, 20]
print(myList)
myList.append(40)
print('popped', myList.pop())
print('post-list:', myList)

print('index of 20:', myList.index(20))
myList.insert(2, 222)
print(myList)
myList.remove(222)
print(myList)

myList.extend([77, 88, 77])
print('post-extend:', myList)

print('count of `77`:', myList.count(77))

# %% [markdown]
# ### 실습 1. 이름 입력받아 출력하기

# %%
l = []
for i in range(0, 5):
  l.append(input(f'{i + 1}번째 사람 이름:'))

for item in l:
  print(item, end = ' ')

# %% [markdown]
# ### 실습 2

# %%
array = [11, 30, 22, 5, 20]
for item in array:
  print(item, end = ' ')

# %% [markdown]
# ### 실습 3. 최댓값 찾기

# %%
for character in 'hello, world!':
  print(f'-{character}', end='')

# %% [markdown]
# ### 실습 4. 최댓값 찾기

# %%
v = [7, 99, 18, 35, 57, 71, 33, 43]
m = v[0]
for item in v:
  if item > m:
    m = item

print(f'최댓값: {m}')


# %%
# 함수 버전
def f_max(v):
  m = v[0]
  for item in v:
    if item > m:
      m = item
  return m


print(f_max([7, 99, 18, 35, 57, 71, 33, 43]))
print(f_max([1, 8, 23, 35, 8, 20]))

# %% [markdown]
# ### 실습 5. 가장 큰 숫자 위치

# %%
v = [7, 99, 18, 35, 57, 71, 33, 43]
m = v[0]
i = 0
for (index, item) in enumerate(v):
  if item > m:
    m = item
    i = index

print(f'최댓값: {m}, 위치: {i}')

# %% [markdown]
# ### 실습 6. 리스트 정렬
# ~~으아아아아아아~~

# %%
from random import randint
original = [randint(0, 2000) for i in range(0, 20)]
n = len(original)


def swap(list, a, b):
  temp = list[a]
  list[a] = list[b]
  list[b] = temp

# %% [markdown]
# #### 기본적인 정렬 (찾아보니 Selection sort임)
# - 직접 만듦

# %%
# linear: O(n^2)

l = original.copy()


def minIndex(start):
  m = (start, l[start])
  for i in range(start, len(l)):
    if l[i] < m[1]:
      m = (i, l[i])
  return m[0]


for x in range(0, len(l)):
  m = minIndex(x)
  swap(l, m, x)

print(l)

# %% [markdown]
# #### 뭔지 모르지만 정렬(실패)
# - 직접 만들다 실패

# %%
# what sort is it called IDK
# 실패...
l = original.copy()

# sort for minimum block
for start in range(0, n, 2):
  a = l[start]
  b = l[start + 1]
  if a < b:
    l[start] = b
    l[start + 1] = a

blockSize = 2

while(blockSize < n):
  for start in range(0, blockSize):
    for iteration in range(start, n, blockSize):
      minValue = l[iteration]
      minIndex = iteration
      for i in range(iteration, n, blockSize):
        if l[i] < minValue:
          minValue = l[i]
          minIndex = i

      swap(l, minIndex, iteration)


  blockSize = blockSize * 2

print(l)

# %% [markdown]
# #### Quick sort
# [참고 문서: 위키피디아](https://ko.wikipedia.org/wiki/%ED%80%B5_%EC%A0%95%EB%A0%AC)

# %%
def partition(arr, start, end):
  # select pivot from first element
  pivot = arr[start]

  left = start + 1
  right = end

  done = False

  while not done:
    # advance left while less than pivot
    while left <= right and arr[left] <= pivot:
      left += 1

    # advance right while greater than pivot
    while left <= right and pivot <= arr[right]:
      right -= 1

    if right < left:
      # ended
      done = True
    else:
      # swap
      swap(arr, left, right)

  swap(arr, start, right)

  return right


def quickSort(arr, start, end):
  if start < end:
    pivot = partition(arr, start, end)
    quickSort(arr, start, pivot - 1)
    quickSort(arr, pivot + 1, end)
  return arr

l = original.copy()
quickSort(l, 0, n - 1)
print(l)

# %% [markdown]
# #### Bubble sort
# [참고 문서: 위키피디아](https://ko.wikipedia.org/wiki/%EA%B1%B0%ED%92%88_%EC%A0%95%EB%A0%AC)

# %%
# swap two adjacent elements
def bubbleSort(l):
  length = len(l) - 1

  for i in range(length):
    for j in range(length - i):
      if l[j] > l[j + 1]:
        swap(l, j, j + 1)

l = original.copy()
bubbleSort(l)
print(l)

# %% [markdown]
# #### 직접 구현한 것 3 (찾아보니 Merge sort)

# %%
def mergeSort(l):
  ln = len(l)
  if ln == 1:
    return
  center = round(ln / 2)
  if center == 0 or center == ln:
    return

  left = l[0:center]
  ll = len(left)
  mergeSort(left)
  right = l[center:ln]
  rl = len(right)
  mergeSort(right)

  i = 0
  j = 0

  for index in range(0, ln):
    a = left[i]
    b = right[j]
    if a < b:
      l[index] = a
      i += 1

      if i >= ll:
        for ii in range(index + 1, ln):
          l[ii] = right[j]
          j += 1
        break

    else:
      l[index] = b
      j += 1

      if j >= rl:
        for ii in range(index + 1, ln):
          l[ii] = left[i]
          i += 1
        break


l = original.copy()
mergeSort(l)
print(l)

# %% [markdown]
# ### 실습 7. 출력 결과와 같은 리스트
# ```
# 1 2 3 4
# 5 6 7 8
# 9 10 11 12
# ```

# %%
l = []

value = 1
for x in range(0, 3):
  lx = []

  for y in range(0, 4):
    lx.append(value)
    value = value + 1
    
  l.append(lx)

# 1번 방식
for x in range(0, 3):
  for y in range(0, 4):
    print(l[x][y], end = '\t')
  print()

print('-------------------------------')

# 2번 방식 (훨씬 깔끔하고 가변적이긴 함)
for x in l:
  for y in x:
    print(y, end = '\t')
  print()

# %% [markdown]
# ## 함수

# %%
def mul(a, b):
  return a * b

mul(3, 5)


# %%
def prints(*data):
  print(*data)

prints('hello', 'world')

# %% [markdown]
# ### 실습 1. 사용자 정의 함수를 만들고 출력 결과와 같은 프로그램을 작성하시오.
# **조건:**
# - 14시에 상품을 3개 이상 구매하면 10&nbsp;% 할인
# - 20시에 상품을 5개 이상 구매하면 20&nbsp;% 할인

# %%
# TODO


# %%
calcValue('kim', hour = 15, count = 3, price = 30000)


