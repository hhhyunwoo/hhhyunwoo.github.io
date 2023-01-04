---
layout: post
title: "[Clean code] Ch12. Emergence"
date: 2023-01-04
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

# Ch12. Emergence
## 테스트

### 모든 테스트를 실행한다

## 리팩터링

### 중복을 없앤다

### 프로그래머 의도를 표현한다

### 클래스와 메서드 수를 최소로 줄인다

위의 4가지 규칙을 적용한다면 설계는 단순해진다

- 테스트
    - 테스트를 철저히 거쳐서 모든 테스트 케이스를 항상 통과하는 시스템은 테스트가 가능한 시스템.
    - 결합도가 높으면 테스트 케이스 작성이 어려움
    - → 테스트 케이스를 많이 작성할 수록 자연스럽게 DIP, DI, interface, Abstraction 등 을 사용해서 결합도를 낮추게 됨
- 리팩터링
    - 테스트 케이스가 잘 되어있다면 리팩터링 및 기능 추가 또한 두렵지 않음
    - 중복 없애기
        - Template Method 패턴
            - 특정 작업을 처리하는 일부분을 서브 클래스로 캡슐화해서 전체적인 구조는 바꾸지 않으면서 특정 단계에서 수행하는 내용만 바꾸는 패턴
            - 객체지향에서는 아주 일반적임
            
            ```java
            //추상 클래스 선생님
            abstract class Teacher{
                public void start_class() {
                    inside();
                    attendance();
                    teach();
                    outside();
                }
            	
                // 공통 메서드
                public void inside() {
                    System.out.println("선생님이 강의실로 들어옵니다.");
                }
                
                public void attendance() {
                    System.out.println("선생님이 출석을 부릅니다.");
                }
                
                public void outside() {
                    System.out.println("선생님이 강의실을 나갑니다.");
                }
                
                // 추상 메서드
                abstract void teach();
            }
             
            // 국어 선생님
            class Korean_Teacher extends Teacher{
                
                @Override
                public void teach() {
                    System.out.println("선생님이 국어를 수업합니다.");
                }
            }
             
            //수학 선생님
            class Math_Teacher extends Teacher{
            
                @Override
                public void teach() {
                    System.out.println("선생님이 수학을 수업합니다.");
                }
            }
            
            //영어 선생님
            class English_Teacher extends Teacher{
            
                @Override
                public void teach() {
                    System.out.println("선생님이 영어를 수업합니다.");
                }
            }
            
            public class Main {
                public static void main(String[] args) {
                    Korean_Teacher kr = new Korean_Teacher(); //국어
                    Math_Teacher mt = new Math_Teacher(); //수학
                    English_Teacher en = new English_Teacher(); //영어
                    
                    kr.start_class();
                    System.out.println("----------------------------");
                    mt.start_class();
                    System.out.println("----------------------------");
                    en.start_class();
                }
            }
            ```
            
    - 표현하기
        - 유지보수가 제일 코스트가 큼
        - 코드를 이해하기 쉽게 만들어야함
            - 좋은 이름
            - 함수와 클래스 크기 줄이기
            - 표준명칭
                - 클래스가 표준 패턴을 사용하여 구현된다면 클래스 이름에 패턴 이름을 넣어주기
                    - singleton, factory, facade … 등
            - 유닛 테스트 케이스 꼼꼼히 작성
            - 노오력
    - 클래스와 메서드 수를 최소로 줄여라
        - 중요하긴 하지만, 테스트 케이스 만들고 리펙터링 하는게 더 중요함
        - 목표는 함수와 클래스 크기를 작게 유지하면서 동시에 시스템 크기도 작게 유지하는 데 있음