let stacks = {
  stacks: [
    {
      id: 0,
      title: "Gradle",
      content: "안드로이드, 코틀린, 자바 계열에서 많이 쓰이는 빌드 도구인 Gradle을 다뤄본 적이 있습니다.",
      createdAt: "2022-01-27",
      modifiedAt: "2023-02-11",
    },
    {
      id: 1,
      title: "Android",
      content: "안드로이드 개발을 해봤습니다. 아마 제가 해본 것들 중에서 가장 많이 한 분야가 아닐까 싶습니다.\n" +
        "자가진단 매크로 앱을 비롯해서 여러 앱들을 대충 만들어봤지만 실제로 어딘가에 올릴만한 앱은 자가진단 매크로 앱밖에 없습니다.\n" +
        "참고로 중학교쯤에 ASM(Android Studio Mobile)이라는 앱을 여러명이서 만든 적이 있었는데 다들 고등학생이 되고 바빠지면서 자연스럽게 와해된 프로젝트도 있습니다.",
      createdAt: "2021-11-27",
      modifiedAt: "2023-01-08",
    },
    {
      id: 2,
      title: "Kotlin",
      content: "안드로이드 개발, 데스크톱 앱 개발, 기타 일반적인 목적의 프로그래밍 용도로 Kotlin을 사용합니다." +
        "최근에는 llang이라는 프로그래밍 언어를 이 언어로 만들어보고 있는데, 툴링과 IDE 지원, 컴파일러로 전달할 데이터를 노출하는 부분 위주로 만들고 있습니다.",
      createdAt: "2022-01-27",
      modifiedAt: "2023-02-11",
    },
    {
      id: 3,
      title: "Python",
      content: "공동교육과정(고등학교)에서 파이썬을 배워서 '고급 계산기'(연산자 우선순위를 고려하는 수식 파서 + 인터프리터) 같은 것들을 만들어본 적이 있습니다.",
      createdAt: "2022-01-27",
      modifiedAt: "2023-02-11",
    },
  ],
  lastId: 4
}

module.exports = {
  getStacks() {
    return stacks
  },

  validateStack: { // I desparately need zod etc
    title(value) {
      return typeof value == "string" && value.length <= 50
    },
    content(value) {
      return typeof value == "string" && value.length <= 1000
    }
  }
}
