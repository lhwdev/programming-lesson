from typing import *

# 토큰들

# %%
# 연산자 토큰들의 종류. ','는 함수 호출 시 인수들을 구분하는데 쓰임
tOperators1 = ['+', '-', '*', '/', '^', '%', '>', '<', '~', '=']
tOperators2 = ['!=']
tTerminators = ['.', ',']
# 연산자 우선순위: 높은 연산자가 우선적으로 계산됨
# 우선순위가 같다면 앞부터 순서대로 계산됨, 괄호의 경우 항상 최우선적으로 실행
# 따라서 1 + 2 * 3 ^ (4 - 5) - 6의 경우 [{1 + (2 * [3 ^ (4 - 5)])} - 6]처럼 묶임
tOperatorPrecedences = {
    '^': 85,
    '*': 80,
    '/': 80,
    '%': 80,
    '+': 50,
    '-': 50,
    '=': 30,
    '!=': 30,
    '>': 30,
    '<': 30,
    '~': 20,

    # stubs: 모든 연산자는 일단 우선순위를 지정해야 하기에... 임시로 둠
    ',': -1
}
# 이항 연산자: a + b처럼 이항연산을 하는 경우
# binaryOperators = ['+', '-', '*', '/', '%', '^']
# 단항 연산자: +a, -a처럼 머리에 붙어서 한 숫자와만 관여하는 경우
# unaryOperators = ['+', '-']
# 가능한 숫자의 종류: 123.45 같은거
tDigits = '0123456789e.'

# 가능한 글자의 종류: 파이썬 내장함수인 isalpha에 의존하기로 함 (구현하기 귀찮아요 ㅠㅠ)


# '토큰': 평면적인 연산자, 숫자, 괄호 등을 추상화함
# 클래스는 예전에 다른 프로그래밍 수업에서 배운거라... 대충 데이터들을 묶어놓은 것이라 생각하면 됩니다
class Token:
  # 종류: 'number'(숫자), 'operator'(연산자), 'group/group_close'(괄호 열기/닫기), 'text'(글자: 함수의 이름 등: 'cos', 'tan', 'f', 'x' 등이 가능함)
  kind: str
  # 해당하는 코드 부분: '123', 'cos', '*', '(', ')' 등
  code: str
  # 연산자라면 우선순위: tOperatorPrecedences에서 불러온 값
  precedence: int

  def __init__(self, kind: str, code: str, precedence: int):
    self.kind = kind
    self.code = code
    self.precedence = precedence

  def __repr__(self):
    return f'{self.code}'


# %% [markdown]
# ### Tokenizer

# %%


# 그냥 글자 ('1 + 3 * 4' 같은)을 받아서 Token들로 바꿔주는 (숫자 1, 연산자 +, 숫자 3, 연산자 *, 숫자 4) 공장?
class Tokenizer:
  index: int = 0
  code: str

  def __init__(self, code: str):
    self.code = code

  # 끝까지 다 봤는지 여부
  def eof(self):
    return self.index == len(self.code)

  # 다음 '토큰'을 불러오는 함수
  def advance(self):
    while True:  # 띄어쓰기는 무시하기 때문에 띄어쓰기를 제외한 다음 토큰을 찾아서 반환함
      start = self.index
      c = self.code[start]
      self.index += 1

      def match2(index):
        if index + 1 >= len(self.code):
          return False

        c2 = self.code[index + 1]
        s = f'{c}{c2}'
        return s in tOperators2

      # match는 if .. else if .. else가 귀찮을 때 쓸 수 있음
      # 아래 코드는 if c in tOperators: .. else if c in tDigits: .. else if c == '(': .. 와 같음
      # 지금 텍스트가
      if c == '(':  # 괄호 열기
        return Token(kind='group', code=c, precedence=1000)
      elif c == ')':  # 괄호 닫기
        return Token(kind='group_close', code=c, precedence=1000)
      elif c in tOperators1:  # 연산자
        return Token(kind='operator',
                     code=c,
                     precedence=tOperatorPrecedences[c])
      elif match2(start):
        return Token(kind='operator',
                     code=self.code[start:start + 1],
                     precedence=tOperatorPrecedences[c])
      elif c in tTerminators:
        return Token(kind='terminator', code=c, precedence=-100)
      elif c.isdigit():  # 숫자
        # Parse number
        while (not self.eof()) and self.code[self.index] in tDigits:
          self.index += 1
        return Token(kind='number',
                     code=self.code[start:self.index],
                     precedence=0)
      elif c.isalpha():  # 글자
        while (not self.eof()) and self.code[self.index].isalpha():
          self.index += 1
        return Token(kind='text',
                     code=self.code[start:self.index],
                     precedence=0)
      else:
        if c.isspace():  # 띄어쓰기는 무시
          continue
        raise Exception(f'Malformed expression: {c} at {start}')


def debugTokens(tokens: List[Token]):
  return {"".join([t.code for t in tokens])}


# 토큰들의 목록. tokens[a:b]는 새로운 리스트를 만들기 때문에 메모리 사용량이 많아질 수 있음.
# 대신 TokenReference.ofEnd(tokens, a, b)라는걸 만듦
class TokenReference:
  # tokens
  allTokens: List[Token]
  # a
  start: int
  # b
  end: int

  def __init__(self, allTokens: List[Token], start: int, end: int):
    self.allTokens = allTokens
    self.start = start
    self.end = end

  @staticmethod
  def ofEnd(allTokens: List[Token], start: int, end: int):
    return TokenReference(allTokens, start, end)

  @staticmethod
  def ofCount(allTokens: List[Token], start: int, count: int):
    return TokenReference(allTokens, start, start + count)

  # operator라고 해서 이것[index] 같은 것을 할 수 있게 함
  def __getitem__(self, index: int):
    return self.allTokens[self.start + index]

  def __len__(self):
    return self.end - self.start

  def __repr__(self):
    return f'TokenReference({self.allTokens[self.start:self.end]})'


# %% [markdown]
# ### 노드들

# %%


# '노드'는 수식의 구조적인 것을 나타냄.
# 보통 이런 '노드'를 AST(Abstract Syntax Tree)라고 하는데, 구문(수학의 문법; 곱하기 나누기 같은 스타일이라 해야하나)을 추상적인 트리 형식으로 나타낸 것.
# 예를 들어 1 + 2 * 3이라는 수식은 1 더하기 (2 곱하기 3)이라고 나타낼 수 있고, 이걸 '노드'를 통해 나타내면 대략적으로
# Add(1, Multiply(2, 3))처럼 나타낼 수 있음. (실제로 이 코드에서는 조금 다름)
class Node:
  parent: Optional['Node']
  tokens: TokenReference
  kind: str

  # 이 '노드'를 구성하는 토큰들이 원래 뭐였는지 포함하면 개발이 편할 것 같아서 tokens를 받게 해놨음
  def __init__(self, tokens):
    self.tokens = tokens


# 그룹: 괄호로 묶인 부분
class Group(Node):
  node: Node

  # 클래스를 '만들 때' 호출됨.
  # 따라서 Group(tokens, node)라고 쓸 수 있음.
  def __init__(self, tokens, node):
    super().__init__(tokens)
    self.node = node
    self.kind = 'group'

  # 참고: __repr__은 그 클래스의 값을 문자열로 바꿀 때 기본적으로 호출됨.
  # print(node)를 할 때 겁나 괴랄하게 출력된다면 버그 고치기 힘들 것 같아서 만들음.
  def __repr__(self):
    return f'{self.node}'

  # 원본 수식으로 되돌리는 함수
  def code(self):
    return self.node.code()


# 이항 연산자: left + operator같은 것들
class BinaryOperator(Node):
  left: Node
  right: Node
  operator: str

  def __init__(self, tokens, left, right, operator):
    super().__init__(tokens)
    self.left = left
    self.right = right
    self.operator = operator
    self.kind = 'binary_operator'

  def __repr__(self) -> str:
    return f'BinaryOperator({self.left}, "{self.operator}", {self.right})'

  def code(self):  # left * right
    return f'({self.left} {self.operator} {self.right})'


# 단항 연산자: -value 같은 것
class UnaryOperator(Node):
  value: Node
  operator: str

  def __init__(self, tokens, value, operator):
    super().__init__(tokens)
    self.value = value
    self.operator = operator
    self.kind = 'unary_operator'

  def __repr__(self) -> str:
    return f'UnaryOperator("{self.operator}", {self.value})'

  def code(self):  # -123
    return f'({self.operator}{self.value})'


# 숫자 그 자체
class Number(Node):
  number: float

  def __init__(self, tokens, number):
    super().__init__(tokens)
    self.number = number
    self.kind = 'number'

  def __repr__(self) -> str:
    return f'{self.number}'

  def code(self):  # 123
    return f'{self.number}'


# 문자: 'x'처럼 변수나 상수가 되는 것들
class Symbol(Node):
  symbol: str

  def __init__(self, tokens, symbol):
    super().__init__(tokens)
    self.symbol = symbol
    self.kind = 'symbol'

  def __repr__(self) -> str:
    return f'Symbol("{self.symbol}")'

  def code(self):  # x
    return f'{self.symbol}'


# 함숫값: 함수를 호출한 값을 나타냄
# 예시: f(x), sin(2 * PI) 등
class FunctionValue(Node):
  name: str  # 함수 이름
  # targetFunction: Function # 함수를 호출할 때 호출하는 곳. sin, cos, tan같은 내장함수의 경우 자동으로 지정됨.
  args: List[Node]  # 인수들. 리스트로 둬서 다변수함수도 구현할 수 있음

  def __init__(self, tokens, name, args):
    super().__init__(tokens)
    self.name = name
    self.args = args
    self.kind = 'function_value'

  def __repr__(self) -> str:
    return f'FunctionValue("{self.name}", args={self.args})'

  def code(self):  # function_name(arg1, arg2, ...)
    return f'{self.name}({", ".join([str(arg) for arg in self.args])})'


class Definition(Node):
  name: str
  target: Node

  def __init__(self, tokens, name, target):
    super().__init__(tokens)
    self.name = name
    self.target = target
    self.kind = 'definition'

  def __repr__(self) -> str:
    return f'Definition(name={self.name}, target={self.target})'

  def code(self):
    return 'Let ' + self.target.code()


class Contexted(Node):
  contexts: dict
  node: Node

  def __init__(self, tokens, contexts, node):
    super().__init__(tokens)
    self.contexts = contexts
    self.node = node
    self.kind = 'contexted'

  def __repr__(self) -> str:
    return f'Contexted(contexts={self.contexts}, {self.node})'

  def code(self):
    # raise Exception('TODO')
    return f'(TODO) {self}'


# %%
class Context:
  pass


# 그냥 말그대로 함수.
# 내장함수는 이거가 기본으로 제공됨.
class Function(Context):
  # 계산하는 함수: (interpret 함수(다른 노드를 계산하는데 쓰임), 인수 목록, context) -> 값
  calculate: Callable[[Callable[[Node, dict], float], List[float], dict],
                      float]

  def __init__(self, calculate):
    self.calculate = calculate

  def __repr__(self) -> str:
    return f'Function({self.calculate}'


class SymbolValue(Context):
  value: Callable[[Callable[[Node, dict], float], dict], float]

  def __init__(self, value):
    self.value = value

  def __repr__(self) -> str:
    return f'SymbolValue({self.value}'


# %% [markdown]
# ### 파서

# %%
'''
간단한 수식 계산기 파서 (파서 = 토큰들을 '노드'로 바꾸는 것)
.. '간단한'?

고려해야 할 점:
- 연산자 우선순위 구현: `*`, `/` 연산자가 `+`, `-` 연산자보다 먼저 계산됨 (괄호는 말할 것도 없고)
  이게 골때림. 개발하는데 힘들었어요 ㅠㅠ
- 오류 알려주기. 지금은 이게 잘 구현돼있지 않은데, 잘못된 수식을 보면 알려줘야 한다.

따라서 이 함수는
1.  괄호를 인식함
    괄호를 본다면 급발작 스위치가 발동해서 괄호 부분을 먼저 파싱함
2.  사용된 연산자들을 우선순위별로 분류함
3.  우선순위가 높은 연산자부터 계산함

대략적인 작동방법을 보자면,
코드:          1  +  2  *  (  3  +  4  *  5  )  +  6
(괄호 먼저 계산)                                                    
연산자 우선순위:                   2     1             <- 리스트에 현재 담겨있는 내용
- 우선순위 = 1:                      A  A  A          (A = 4 * 5)
- 우선순위 = 2:                B  B  B  B  B          (B = 3 + A)
(괄호 밖)
연산자 우선순위:    2     1  B  B  B  B  B  B  B  2   
- 우선순위 = 1:    2  C  C  C  C  C  C  C  C  C  2    (C = 2 * B)
- 우선순위 = 2:    D  D  D  D  D  D  D  D  D  D  2    (D = 1 + C) <- 1페이즈
- 우선순위 = 2:    E  E  E  E  E  E  E  E  E  E  E  E (E = D + 6) <- 2페이즈
완성된 AST: E = [{1 + (2 * {3 + (4 * 5)})} + 6]


tokens: 전체 토큰들
start: .. 중에서 시작 위치,
end: 끝 위치
'''


def parseToAst(tokens: List[Token], nodes, start: int, end: int) -> Node:
  if start == end:
    raise Exception(f'Unknown index: {start} to {end}')

  # 범위 내에서 첫번째 토큰이
  firstToken = tokens[start]

  def parseText(index, ahead):
    s = index
    text = tokens[index]
    # 뒤에 괄호가 오면 함수 호출
    if text.code == 'Let':
      # 지금 지원하는 형태: Let f(x) = 3x + 5, ...
      equation = parseToAst(tokens, nodes, start + 1, end)
      assert isinstance(
          equation, BinaryOperator
      ), f'Let 이후 따라오는 값이 f(x) = ...와 같은 등식의 형태가 아닙니다. 받은 수식: {equation}'
      assert equation.operator == '='

      left = equation.left

      if isinstance(left, FunctionValue):
        name = left.name

        # Let f(3 * x) = 5 * x 같은 형태는 아직 지원하지 않음, 즉 args는 각각 Symbol이여야 함
        names = []
        for node in left.args:
          assert isinstance(
              node, Symbol
          ), '현재 함수를 정의할 때의 인수는 단순한 기호만 지원합니다. 즉, f(x, y, z)의 형태는 지원하지만 f(3 * x, 5 - y)와 같은 형태는 지원하지 않습니다.'
          names.append(node.symbol)

        def fromValues(args, values):
          context = {}
          for i in range(len(args)):
            name = args[i]
            value = values[i]
            context[name] = value
          return context

        defined = Function(
            lambda interpret, args, context: interpret(equation.right, {
                **context,
                **fromValues(names, args)
            }))

      elif isinstance(left, Symbol):
        name = left.symbol
        defined = SymbolValue(
            lambda interpret, context: interpret(equation.right, context))

      else:
        raise Exception(
            f'지원되지 않는 정의 형식입니다. 현재는 f(x) = ...과 x = ...처럼 좌변에 함수나 문자 그 자체만 올 수 있습니다.'
        )

      # `count=1 + len(equation.tokens)`: 1를 더하는 이유는 ','/'.'(terminator)를 건너뜀
      localEnd = index + 1 + len(equation.tokens)

      if end != localEnd:
        # 이 경우: Let f(x) = 3, f(5)처럼 Definition이 context로 작용해야 할 경우
        if tokens[localEnd].kind == 'terminator':
          node = parseToAst(tokens, nodes, localEnd + 1, end)
          if isinstance(node, Contexted):
            merged = Contexted(tokens=TokenReference.ofEnd(allTokens=tokens,
                                                           start=index,
                                                           end=localEnd + 1 +
                                                           len(node.tokens)),
                               contexts={
                                   **node.contexts, name: defined
                               },
                               node=node.node)
            return merged

          else:
            return Contexted(tokens=TokenReference.ofEnd(allTokens=tokens,
                                                         start=index,
                                                         end=localEnd + 1 +
                                                         len(node.tokens)),
                             contexts={name: defined},
                             node=node)

        else:
          raise Exception(
              f'바른 수식이 아닙니다. Let f(x) = 3 * x처럼 입력한 후에는 온점(.)이나 쉼표(,)로 구분해줘야 합니다.'
          )

      else:
        # 이 경우: 정의 그 자체
        return Definition(tokens=TokenReference.ofEnd(allTokens=tokens,
                                                      start=index,
                                                      end=localEnd),
                          name=name,
                          target=defined)

    elif (not ahead) and index + 1 < end and tokens[index + 1].kind == 'group':
      # 함수 호출

      index += 2  # 괄호 안부터 시작: 함수 이름(index번째 토큰), 괄호, 괄호 안(index + 2번째: 여기부터)

      # 인수들을 각자 파싱함
      args = []
      while index < end:
        arg = parseToAst(tokens, nodes, index, end)
        args.append(arg)
        index += len(arg.tokens)

        if tokens[index].code == ',':  # ,로 끝남
          index += 1
          continue
        else:  # )로 끝남
          index += 1
          break

      return FunctionValue(TokenReference.ofEnd(allTokens=tokens,
                                                start=s,
                                                end=index),
                           name=text.code,
                           args=args)

    else:  # 뒤에 괄호가 오지 않음. 단순한 변수/상수
      if ahead:
        return None

      return Symbol(TokenReference.ofCount(allTokens=tokens, start=s, count=1),
                    symbol=text.code)

  kind = firstToken.kind
  if kind == 'group':  # 괄호 열기
    node = parseToAst(tokens, nodes, start + 1, end)
    return Group(
        TokenReference.ofCount(allTokens=tokens,
                               start=start,
                               count=len(node.tokens) + 2), node)

  if kind == 'operator':  # 연산자: 처음부터 이게 오면 단항 연산자임
    value = parseToAst(tokens, nodes, start + 1, end)
    return UnaryOperator(
        TokenReference.ofCount(allTokens=tokens,
                               start=start,
                               count=len(value.tokens) + 1), value)

  if kind == 'text':  # 글자
    result = parseText(start, ahead=True)
    if result != None:
      return result

  if kind == 'number' or kind == 'text':  # 숫자/문자. 숫자나 문자가 처음에 오면 그냥 숫자가 끝일 수도 있지만 1 * 3 같은 식에서도 1이 맨 앞에 옴
    # 따라서 뒤에 뭐가 따라오는지 확인해야 함

    # 1. Check operator precedences
    #   sort operators by precedence: create list -> put operator precedences in it
    # 2. Parse expression
    #   execute the operator with high precedence first, top-down
    # 3. Return result

    # 1. 연산자들의 우선순위 확인
    # 노드/우선순위들을 임시로 담아두는 리스트
    # nodes = [None] * nodesCount # elements: int = precedence, Node = parsed node
    # 우선순위들을 모아놓은 집합
    allPrecedences = set()

    # 범위 안의 토큰들을 조사함
    index = start
    while index < end:
      current = tokens[index]

      curKind = current.kind

      # In case of group
      if curKind == 'group':  # 말했다시피 괄호를 보면 바로 발작함
        # 괄호 안의 내용물을 파싱함
        groupValue = parseToAst(tokens, nodes, index, end)

        # 위 작동방법에서 그룹 전체를 'B'로 채우는 것과 같은 과정
        for ii in range(index, index + len(groupValue.tokens)):
          nodes[ii] = groupValue
        index += len(groupValue.tokens)  # 그룹 + 그 안의 총 토큰 개수만큼 이동

      elif curKind == 'group_close':  # 괄호닫기. 바로 위에서 그룹을 파싱할 때 이게 호출될 때까지 반복함
        break  # while문에서 빠져나오기

      elif curKind == 'text':
        node = parseText(index, ahead=False)

        # 위 작동방법에서 그룹 전체를 'B'로 채우는 것과 같은 과정
        for ii in range(index, index + len(node.tokens)):
          nodes[ii] = node
        index += len(node.tokens)  # 그룹 + 그 안의 총 토큰 개수만큼 이동

      elif curKind == 'operator':  # 연산자. nodes에 우선순위를 담아둠
        precedence = current.precedence
        nodes[index] = precedence
        allPrecedences.add(precedence)
        index += 1

      elif curKind == 'number':  # 숫자. 숫자 노드를 nodes에 담아둠
        nodes[index] = Number(
            TokenReference.ofCount(allTokens=tokens, start=index, count=1),
            float(current.code))
        index += 1

      elif curKind == 'terminator':  # 이 루프를 멈추러 왔다
        break

      else:
        index += 1

    limit = index

    # 2. Parse expression
    #   execute the operator with high precedence first sequentially
    # TODO: is there a way to optimize? This produces high complexity

    # 높은 우선순위부터 차례대로 실행
    for precedence in sorted(allPrecedences,
                             reverse=True):  # from high to low precedence
      index = start

      # 순차적으로 실행
      while index < limit:
        node = nodes[index]


        if type(node) == int:
          # 지금 찾는 우선순위와 같은 우선순위 발견!
          if node == precedence:
            operator = tokens[index].code

            # 왼쪽 값
            left = nodes[index - 1]
            # 오른쪽 값
            right = nodes[index + 1]

            # 위 '작동방식'에서 본 것처럼 A A A 같은 식으로 다 채워줌
            localStart = index - len(left.tokens)
            localEnd = index + len(right.tokens) + 1
            operator = BinaryOperator(tokens=TokenReference.ofEnd(
                allTokens=tokens, start=localStart, end=localEnd),
                                      left=left,
                                      right=right,
                                      operator=operator)
            

            for indexToSet in range(localStart, localEnd):
              nodes[indexToSet] = operator

            index = localEnd
          else:
            index += 1
        else:
          # 노드를 만나면
          index += 1  # 그냥 계속해서 감

    return nodes[start]

  else:
    raise Exception(f'Malformed token: unknown token kind {firstToken.kind}')


# %%
def parseMathToAst(code: str):
  tokenizer = Tokenizer(code)
  tokens = []

  while not tokenizer.eof():
    tokens.append(tokenizer.advance())

  return parseToAst(tokens=tokens,
                    nodes=[None] * len(tokens),
                    start=0,
                    end=len(tokens))


# %% [markdown]
# ### 인터프리터

# %%
import math

builtinFunctions = {
    'sin':
    Function(lambda _interpret, args, _context: math.sin(args[0])),
    'cos':
    Function(lambda _interpret, args, _context: math.cos(args[0])),
    'tan':
    Function(lambda _interpret, args, _context: math.tan(args[0])),
    'asin':
    Function(lambda _interpret, args, _context: math.asin(args[0])),
    'asinh':
    Function(lambda _interpret, args, _context: math.asinh(args[0])),
    'acos':
    Function(lambda _interpret, args, _context: math.acos(args[0])),
    'acosh':
    Function(lambda _interpret, args, _context: math.acosh(args[0])),
    'atan':
    Function(lambda _interpret, args, _context: math.atan(args[0])),
    'atan2':
    Function(lambda _interpret, args, _context: math.atan(args[0], args[1])),
    'atanh':
    Function(lambda _interpret, args, _context: math.atanh(args[0])),
    'ceil':
    Function(lambda _interpret, args, _context: math.ceil(args[0])),
    'floor':
    Function(lambda _interpret, args, _context: math.floor(args[0])),
    'round':
    Function(lambda _interpret, args, _context: round(args[0])),
    'log':
    Function(lambda _interpret, args, _context: math.log10(args[0])),
    'ln':
    Function(lambda _interpret, args, _context: math.log(args[0]))
}

builtinSymbols = {'pi': math.pi, 'e': math.e}


# %%
def interpret(node: Node, context: dict):
  if isinstance(node, Number):
    return node.number

  elif isinstance(node, BinaryOperator):
    left = interpret(node.left, context)
    right = interpret(node.right, context)
    operator = node.operator

    if operator == '+':
      return left + right
    elif operator == '-':
      return left - right
    elif operator == '*':
      return left * right
    elif operator == '/':
      return left / right
    elif operator == '%':
      return left % right
    elif operator == '^':
      return left**right
    else:
      raise Exception(f'Unknown binary operator {operator}')

  elif isinstance(node, UnaryOperator):
    value = interpret(node.value, context)
    operator = node.operator

    if operator == '-':
      return -value
    elif operator == '+':
      return +value
    elif operator == '~':
      return not value
    else:
      raise Exception(f'Unknown unary operator {operator}')

  elif isinstance(node, FunctionValue):
    values = [interpret(arg, context) for arg in node.args]

    if node.name in builtinFunctions:
      return builtinFunctions[node.name].calculate(interpret, values, context)
    elif node.name in context:
      function = context[node.name]
      return function.calculate(interpret, values, context)
    else:
      raise Exception(f'{node.name}이라는 함수가 없어요.')

  elif isinstance(node, Symbol):
    if node.symbol in builtinSymbols:
      return builtinSymbols[node.symbol]
    elif node.symbol in context:
      value = context[node.symbol]
      if isinstance(value, SymbolValue):
        return value.value(interpret, context)
      else:
        return value
    else:
      raise Exception(f'{node.symbol}라는 기호가 없어요.')

  elif isinstance(node, Contexted):
    return interpret(node.node, {**context, **node.contexts})

  elif isinstance(node, Group):
    return interpret(node.node, context)
  else:
    raise Exception(f'Unknown node type {type(node)}')


def main():
  context = {}

  while True:
    line = input('수식 계산기> ')
    node = parseMathToAst(line)

    if isinstance(node, Definition):
      context[node.name] = node.target  # repr mode, preserve locals
    else:
      value = interpret(node, context)
      print(f'계산결과: {value}')


if __name__ == '__main__':
  main()
