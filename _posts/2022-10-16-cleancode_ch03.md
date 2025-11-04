---
layout: post
title: "[Clean code] Ch03. Functions"
date: 2022-10-16
categories:
  - mentoring/books
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

# Ch03 Functions

### Fitnesse 란
- Fitnesse는 입력 값 과 결과 값을 WIKI페이지에 입력하고 검증을 수행하므로 항상 결과에 대한 기대 값은 동일해야 한다는 제약사항이 존재한다.

## Small!

1. 작아야함
2. 더 작아야함

스크린에 가득차면 안됨.

20줄정도

### Blocks and Indenting

if, while 등의 블록의 인덴트는 하나여야함. 즉, 중첩이면 안된다. 

## Do one Thing

Functions should do one thing. They should do it well, They should do it only

One thing 이라는 것을 판단하는 기준 - 추상화 레벨. 다른 이름으로 함수를 추출해낼 수 있다면 한가지 일이 아님

Keep It Simple Stupid

추상화 수준이 섞이면 특정 표현이 근본 개념인지, 세부사항인지 구분하기 어려움! 

## 내려가기 규칙

A A’ B B’
—
A B A’ B’

- 위의 내용이 더 맞다고 주장함.  스타일 차이?

## Switch 문

인스턴스를 생성만하는 factory 패턴으로는 가능! 

그렇지 않으면 case가 늘어날때마다 service logic의 switch문이 무한정 길어짐 

## 서술적인 이름 사용

## 함수 인수

무항이 이상적임

3,4개는 피하는게 좋음 

플래그 인수는 추함. → 플래그를 통해서 여러가지 작업을 하겠다는 것을 의미한다는 것이 모순

인수가 2,3개 필요하다면 클래스의 변수로 선언하는 것이 더 나음.

## 출력 인수

appendFooter(s);

s가 출력으로 사용되면 안됨! 좀 어색함

## 오류 코드보다 예외를 사용하라!

차라리 예외를 써라
