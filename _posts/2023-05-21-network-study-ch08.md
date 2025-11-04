---
layout: post
title: "[CISCO 네트워킹] 8. 라우팅 프로토콜과의 한판"
date: 2023-05-21
categories:
  - tech/books
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
## RIP 라는 라우팅 프로토콜에 대한 이야기

### RIP (Routing Information Protocol)

- **라우팅** 프로토콜
- **다이내믹** 프로토콜
- 내부용 라우팅 프로토콜(`IGP`)
- 디스턴스 백터 알고리즘
- 라우터가 좋은 길을 경정하는 기준이 되는 요소 → Hop 카운트
- 디폴트 라우팅 업데이트 주기 → 30초

### RIP 장 단점

- 장점
    - `표준` 라우팅 프로토콜
    - Configuration의 `간단함`
    - `메모리를 적게` 사용함
- 단점
    - 홉 카운트만 가지고 경로를 선택하다 보니 **`실수를 많이 함`**
    - 자신의 라우터에서 15개 이상의 라우터를 거치는 목적지의 경우는 Unreachable 로 정의하고 데이터를 보내지 못함. → ***커다란 네트워크 상에서 사용하기엔 무리***

## Distance-Vector 라우팅 알고리즘에서의 문제점과 해결책

- 한번 배운 라우팅 테이블을 계속 전달하기 때문에 업데이트가 모든 네트워크에 전달되는 시간(Convergence Time)이 많이 걸림.
    - → `Looping` 이 발생할 수 있음
- 해당 문제를 해결하기 위한 대책들
    - **Maximum Hop Count**
        - 최대 홉 카운트를 정해놓으면 루핑이 발생하더라도 멈출 수 있음
    - **Hold Down Timer**
        - 어떤 경로가 죽었다고 판단하면 이 경로에 대한 상태를 바로 바꾸지 않고 일정 시간이 지난 다음에 바꾸겠다는 것
    - **Split Horizon**
        - 라우팅 정보가 들어온 곳으로는 같은 정보를 내보낼 수 없다는 것
    - **Route Poisoning**
        - 라우팅 테이블에 극약 처방
        - 네트워크 A가 다운되면 라우터가 네트워크 A에 대한 메트릭 값을 16으로 바꾸면서 사용할 수 없게 만들어버림
    - **Poison Reverse**
        - 라우팅 정보를 되돌려 보내기는 하되, 이 값을 무한대 값으로 쓰는 방식
- 디스턴스 벡터 알고리즘은 쉽고, 간편하고, 라우팅 테이블을 적게 사용하는 등 여러가지 장점이 있지만, `루핑이 발생하기 쉬움`.

## IGRP 라우팅 프로토콜

- `Interior Gateway Routing Protocol`
- 다이내믹 프로토콜
- 내부용 라우팅 프로토콜 (`IGP`)
- 디스턴스 벡터 알고리즘
- 모든 라우터에서 전부 사용 가능한 프로토콜은 아님
- 다섯 가지 요인을 가지고 가장 좋은 경로를 선택함
    - **Bandwidth**
    - **Delay**
    - **Reliability**
    - **Load**
    - **MTU (Maximum Transmission Unit)**
    - → Hop 카운트만 가지고 목적지를 찾는 RIP 와는 달리 `좀 더 지능적`으로 경로를 선택할 수 있음

### PPS

- Packet Per Second
- PPS = 1 sec / (IFG + Preamble Time + Frame Time)
- IFG : Inter Frame Gap
- Preamble Time : 프레임 앞에 붙는 서두
- Frame Time : 프레임이 날아가는 시간

## OSPF 라우팅 프로토콜

- `Open Shortest Path First`