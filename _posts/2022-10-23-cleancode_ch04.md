---
layout: post
title: "[Clean code] Ch04. Annotation"
date: 2022-10-23
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

# Ch03 Annotation

### 주석은 필요악이다. 순수하게 선하지 못하다. 프로그래밍 언어로 치밀하게 의도를 표현할 수 있다면 주석은 거의 필요하지 않다.

- 프로그래머들이 주석을 유지하고 보수하기란 현실적으로 불가능하다.

근데 요새 잘 짜여진 거의 대부분의 오픈소스들은 엄청난 양의 주석을 가지고 있음.

근데 이게 코드에 대한 설명이라기 보다는 전체적인 오픈소스에 대한 설명이긴 하다 .

### 코드로 의도를 표현하라.

## 좋은 주석

- 법적인 주석
- 정보를 제공하는 주석
- 의도 설명 …

→ 주석이 올바른지 검증하기가  쉽지 않음.

- TODO 주석

## 나쁜 주석

- 거의 대부분
- 코드를 정당화하는 주석도 아니고, 의도나 근거를 설명하는 주석도 아니며, 코드보다 읽기 쉽지않음.
- 의무적인 주석
    - javadocs
    - python 도 있음.
- 있으나 마나 한 주석을 달려는 유혹에서 벗어나 코드를 정리해라
- 주석으로 처리한 코드는 매우 밉살스러운 관행
    - 소스코드 관리 시스템을 사용해야함
- 주석을 달아야 한다면 근처에 있는 코드만 기술해라