---
layout: post
title: "[Clean code] Ch13. Concurrency"
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

# Ch13. Concurrency
동시성과 깔끔한 코드는 양립하기 어렵다! 

멀티스레드 코드는 시스템이 부하를 받기 전까지는 멀쩡하게 돌아가지만, 소수의 케이스에서 이슈가 발생함

- 두개의 스레드 기준으로 잠재적인 경로는 최대 12870개
    - long일 경우 2704156

멀티스레드 프로그래밍에서 어떻게 하면 코드를 깨끗하고 효율적으로 짤 수 있는가에 대한 내용 

## 동시성

- 디커플링 전략
    - 무엇과 언제를 분리
    - 구조적 개선
        - 각 스레드는 다른 스레드와 무관하게 돌아감
- 응답 시간과 작업 처리량 개선
- 항상 성능을 높여주는 것은 아님
- 설계 변할 수 있음
- 동시성에 대해 이해해야함
- 복잡함
- 버그 재현 어려움
- 설계 전략을 근본적으로 다시 바라봐야함

## 동시성 방어원칙

- SRP
    - 반복적으로 나오는 중요한 포인트
    - 동시성과 관련없는 코드는 분리해야함
- Critical section
    - 일반적으로 synchronized로 보호함
    - 최대한 줄여라
- 스레드 테스트 코드
    - 재현 매우 어려움
    - 일회성 오류를 그냥 넘기면 안됨
    - 일단 멀티 스레드랑 관련없는 외부 코드부터 잘 돌아야 함!
    - 다양한 설정에서 돌려봐야함
        - 보조코드
            - 실패하는 경로가 실행될 확률이 극도로 저조함
            - jiggle(흔들다)
            - 무작위로 nop, sleep 이나 yield를 수행
            - 서비스 환경에 바로 넣을 수는 없기 때문에 같은 이름의 두개의 메서드를 생성

→ 이전에 나온 내용대로 코드를 잘 분리하고 잘 짜고, 동시성에 대해 잘 이해하고 있으면 됨!!


### Golang 예제
```go
package main

import (
	"fmt"
	"time"
)

func sendHello(ch1 chan string) {
	time.Sleep(time.Second * 1)
	ch1 <- "hello"
}

func sendWorld(ch2 chan string) {
	time.Sleep(time.Second * 3)
	ch2 <- " world"
}

func receive(ch1 chan string, ch2 chan string, done chan string) {
	var msg string
	for {
		select {
		case msg1 := <-ch1:
			fmt.Println("msg: ", msg1)
			msg += msg1

		case msg2 := <-ch2:
			fmt.Println("msg: ", msg2)
			msg += msg2
			done <- msg
			return
		default:
			fmt.Println("default는 계속 호출됩니다.")
			time.Sleep(time.Second)
		}
	}
}

func main() {
	ch1 := make(chan string)
	ch2 := make(chan string)
	done := make(chan string)
	go sendHello(ch1)
	go sendWorld(ch2)
	go receive(ch1, ch2, done)
	result := <-done
	fmt.Println("result: ", result)
}
===
output

default는 계속 호출됩니다.
default는 계속 호출됩니다.
msg:  hello
default는 계속 호출됩니다.
msg:   world
result:  hello world
```