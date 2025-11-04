---
layout: post
title: "[CISCO 네트워킹] 7. 라우터만 알면 네트워크 도사? (2)"
date: 2023-01-23
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
# 7. 라우터만 알면 네트워크 도사? (2)

## 라우터 셋업 모드

- `Set up` 방식

## 라우터에 명령을 입력하는 두 번째 방법

- `Configuration` 모드
- `configure terminal`
    - 라우터의 구성을 콘솔이나 텔넷을 이용해서 할 때 사용하는 모드
- 라우터의 구성 변경을 위해서는 항상 `privileged` 모드에서 구성 모드로 들어가야하는데, privileged 모드에서 구성 모드로 들어가기 위한 명령은 `configure` 이다.
- 또 구성을 텔넷이나 콘솔로 하는 경우에는 teminal 이라는 옵션을 사용해서 `configure terminal` 을 사용한다.
- 모든 변경을 마치고 빠져 나올 때는 `ctrl + z` , RAM의 구성 파일을 NVRAM으로 저장할 때는 `write memory` or `copy runningconfig startup-config` 명령 입력

## Static 라우팅을 이용한 Router 구성

- `Static` 라우팅
    - 경로를 직접 넣어주기 때문에 라우팅이 빠르게 가능
    - `라우팅 테이블`도 적게 사용함
    - 경로에 문제가 생기면 다른 길을 찾아내지 못하고, 수정해줄 때까지 기다림
    - → 갈 수 있는 경로가 하나밖에 없는 `Stub 라우터 용`으로 많이 사용됨
        - `Stub 네트워크` : 오직 하나의 경로만을 통해서 외부 망과 연결된 네트워크를 의미

### 스태틱 라우팅만 알면 디폴트 라우트는 식은 죽 먹기

- `Default` 라우팅
    - 경로를 찾아내지 못한 모든 네트워크들은 모두 이곳으로 가라고 `미리 정해 놓은 길`
    - 디폴트 라우트를 잡아놓으면 다른 경로에서 해당 네트워크를 못 찾을 때는 무조건 인터넷 쪽 인터페이스로 가보게 되는 것
- Default 라우트 만드는 법
    1. 디폴트 네트워크를 이용
    2. 스태틱 명령을 이용

<img width="837" alt="image" src="https://user-images.githubusercontent.com/37402136/214020188-a24bc595-d336-4ecf-9e9f-b1cdfaea3870.png">

<img width="837" alt="image" src="https://user-images.githubusercontent.com/37402136/214020188-a24bc595-d336-4git commit --amend --author="korband <korband78@gmail.com>"ecf-9e9f-b1cdfaea3870.png">

## Distance Vector 와 Link state

- 라우터는 스태틱 라우팅 프로토콜 / 다이나믹 라우팅 프로토콜로 나뉘었음
- 또 하나의 라우팅 프로토콜에 대한 분류가 `distance vetor` 와 `link state` 이다

### Distance vector

- `거리`와 `벡터`만을 위주로 만들어진 라우팅 프로토콜
- 한 라우터가 모든 라우팅 정보를 가지고 있을 필요가 없기 때문에 라우팅 테이블을 줄일 수 있어서 메모리를 절약하고, 구성 자체가 간단하여 여러 곳에서 `표준으로 사용`되고 있음
- 정해진 시간마다 한 번씩 꼭 라우팅 테이블의 업데이트가 일어나기 때문에 트래픽을 낭비하고 `Convergence Time`이 너무 느림
- → 커다란 네트워크에서는 적용하지 않고 `규모가 작은 네트워크`에 적용할 경우 장점을 살릴 수 있음
- `RIP`(Routing Information Protocol), `IGRP`(Interior Gateway Routing Protocol)

### Link state

- 한 라우터가 목적지까지의 `모든 경로 정보`를 다 알고 있음
- 링크에 대한 정보(어디에 어떤 네트워크가 있고, 거기까지 가려면 어떤 라우터를 통해야 한다는 정보) 를 `토폴러지 데이터베이스`로 만들게 됨
- 토폴러지 데이터베이스를 가지고 `SPF`(Shortest Path First) 라는 알고리즘을 계산 후 SPF 트리를 만듬
- 한 라우터에서 목적지까지의 모든 경로를 알고 있기 때문에 중간에 링크의 변화가 생겨도 이를 알아내는 데 걸리는 시간이 짧음.
- 라우팅 테이블 교환이 자주 발생하지 않고 `트래픽 발생을 줄여줌`
- 라우팅 정보를 관리해야 하기 때문에 메모리 많이 소모, `CPU가 일을 많이 함`
- → `고용량 라우터`에 적용하는 것이 바람직함
- `OSPF`(Open Shortest Path First)

## Telnet 을 이용한 장비 접속

- `Telnet`
    - 기본적으로 TCP/IP 위에 올라가는 프로그램

## Ping 과 Trace

- `핑`과 `트레이스`는 라우터를 구성한 후 네트워크의 연결에 이상이 없는지를 테스트하기 위해 만든 프로그램
    - 즉, 출발지에서 목적지까지 연결에 이상이 없는지, 그리고 이상이 있다면 어디에서 이상이 발생했는지를 핑과 트레이스를 이용해서 찾아낼 수 있음

### Ping

- 단순 핑의 경우 에코 패킷의 출발지를 정할 수 없기 때문에 PC에 가서 직접 핑을 해보지 않는 이상 확인해볼 수 있는 방법이 없음.
- 확장형 핑
    - 에코 패킷의 출발지를 지정
    - 에코 패킷의 크기
    - 핑을 몇 번 보낼 것인가

### Trace

- 출발지에서 목적지 뿐만 아니라 중간에 거친 경로에 대한 정보와 소요 시간까지도 확인해볼 수 있는 것이 Trace 명령