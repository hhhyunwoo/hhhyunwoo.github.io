---
layout: post
title: "[Clean code] Ch11. System"
date: 2023-01-04
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
# Ch11. System

- 자바를 사용하지 않아서 그런지 아니면 설계를 잘 몰라서 그런지 쉽게 이해하기 어려운 챕터였음

- 적절한 추상화와 모듈화 매우 중요

## 시스템 제작(construction)과 시스템 사용(use)를 분리하라

- 관심사 분리
- Main 분리
    - 생성과 관련된 코드는 모두 main or main이 호출하는 모듈로 옮김
    - 나머지 시스템은 모든 객체가 생성되었고 모든 의존성이 연결되었다고 가정
- 팩토리 패턴
    - 팩토리 interface를 구현해서 한 종류의 객체를 만드는 것
    - 다음 챕터에서 나오는 템플릿 메소드 패턴과 유사?
        
        ![image](https://user-images.githubusercontent.com/37402136/187051923-77dc19bb-d7c9-4dfc-9e05-e48196bc23f8.png)
        
- 의존성 주입
    - 하나의 객체가 다른 객체의 의존성을 제공하는 테크닉
    - 스프링
        - 객체 간의 의존성(객체 간의 관례)을 객체 내부에서 직접 해주는 대신, 외부에서 객체를 생성해서 넣어주는 방식
    
    ![image](https://user-images.githubusercontent.com/37402136/187051921-e20aea64-59b7-4bb7-b3c9-521e28ed9468.png)
    

## 확장

- EJB
- AOP
    - 어떤 로직을 기준으로 핵심적인 관점, 부가적인 관점으로 나누어서 보고 그 관점을 기준으로 각각 모듈화하겠다는 것
    - aspect 모듈화하고 핵심적인 비즈니스 로직에서 분리해서 재사용하게다는 것이 AOP의 취지
- POJO

## TDD 구축

## 의사 결정 최적화

- 가능한 마지막 순간까지 결정을 미루는 방법

## 도메인 특화 언어?