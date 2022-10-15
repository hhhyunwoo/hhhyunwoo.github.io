---
layout: post
title: "[Clean code] Ch02. Meaningful Names"
date: 2022-10-15
categories:
  - Study
  - Book
  - Clean Code
tags:
  [
    blog,
    jekyll,
    jekyll theme,
    NexT theme,
    Computer Science,
    컴퓨터공학,
    개발,
    소프트웨어,
    지킬 테마,
    지킬 블로그 포스팅,
    GitHub Pages,
  ]
---

# Ch02. Meaningful Names

## Choosing good names takes time but saves more than it takes.

- 의도를 확실하게 나타내도록 네이밍해야함
- 네임이 코멘트를 필요로한다면 제대로 네이밍 안된것임
    - 하지만 코멘트에 대해서는 견해차이가 있다.
- List가 아닐 경우가 있을 수 있기 때문에 변수 명에 List를 붙일 때는 확실할때만 붙여야 함
- info, data 둘 다 a, an 처럼 의미 없는 구분점임
    - 근데 `local` 과 `global` 을 구분하는데 `the`, `a` 를 쓰는건 괜찮음
- Noise words are redundant
- 변수 명에 `var` 이런것은 noise하며 redundant하다
- Customer, CustomerObject 의 차이가 애매하다? `Object`는 안써도 된다?
- 발음할 수 있는 이름
    - This matters because programming is a social activity.
- 검색할 수 있는 이름
    - prefix 로 `customer` 이런것 붙이면 안됨!
- 자바 같은 경우는 변수 명에 타입을 입력할 필요가 없음
- **Avoid Mental Mapping (기억력을 믿지마라)**
- 명료함이 최고!
- 한개념에 한 단어
    - get, retrieve 애매하게 섞어 쓰면 안됨!
- 변수 명에 기술 개념 사용
    - 타겟 유저가 확실하게 기술직군 개발자이기 때문에 기술 개념(FIFO .. ) 을 쓰는 것이 괜찮다.