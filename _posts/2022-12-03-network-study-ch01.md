---
layout: post
title: "[CISCO 네트워킹] 2. 네트워크와 케이블, 그리고 친구들 "
date: 2022-12-03
categories:
  - Study
  - Book
  - CISCO Networking
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
# 2. 네트워크와 케이블, 그리고 친구들

# LAN vs WAN

![image](https://user-images.githubusercontent.com/37402136/205407866-0cf6dd01-3cc0-441d-9f54-2470bc3734cc.png)

- LAN
    - 어느 한정된 공간에서 네트워크를 구성
- WAN
    - 멀리 떨어진 지역을 서로 연결하는 경우

# Ethernet

- 이더넷은 네트워킹의 한 방식
- 이더넷의 가장 큰 특징은 CSMA/CD 라는 프로토콜을 사용해서 통신한다는 것
- 우리나라에서 사용하는 대부분의 네트워킹 방식이 이더넷임

![image](https://user-images.githubusercontent.com/37402136/205407907-f24dc490-af14-4723-8138-c721a8f7027d.png)

## CSMA/CD

- Carrier Sencse Multiple Access / Collision Detection
    - 눈치게임!
    - 누군가가 네트워크 상에서 통신을 하고 있으면 자기가 보낼 정보가 있어도 못보내고 기다림
- Carrier
    - 네트워크 상에 나타나는 신호
- Multiple Access
    - 동시에 2개 이상의 장비에서 통신을 해버리면 Collision이 발생
    - 그렇게 되면 PC 들은 랜덤한 시간동안 기다렸다가 데이터 다시 전송

# TokenRing

- 오직 한 PC가 네트워크에 데이터를 실어 보낼 수 있음
- Collision 발생하지 않음.
- 네트워크 성능 예측도 쉬움.

# UTP 케이블

- TP
    - Twisted-pair
- UTP
    - Unshielded
- STP
    - Shielded
    - 더 비싸고 성능이 좋음

# MAC

![image](https://user-images.githubusercontent.com/37402136/205407988-6faa7491-05b3-402f-96be-9e81b4b2ddc0.png)

- Media Access Control
- 통신을 위해서 서로를 구분할 일종의 주소가 필요함
- IP 주소를 가지고 다시 MAC 으로 바꾸는 절차가 필요함 (ARP 를 사용)
- 같은 네트워크에 있다면 브로드케스트를 받을 수 있음. 하지만 다른 네트워크라면 도착지의 맥 어드레스를 안 다음에 통신을 시작할 수 있음

# 유니캐스트, 브로드캐스트, 멀티캐스트

### 유니캐스트

- 우리가 가장 많이 사용하는 트래픽
- 항상 출발지와 목적지의 주소를 알고 있어야 함
- 이더넷을 사용(로컬 이더넷에 붙어있는 모든 PC들에게 정보를 뿌리는 Shared 방식이라서 네트워크 통신 시 다 뿌려줌
- 자신의 랜카드 맥 어드레스와 목적지 맥 어드레스가 서로 다른 경우는 바로 그 프레임을 버림
- 같다면 CPU로 프레임을 올려보내면서 작업을 할 수 있게 함

### 브로드캐스트

- 로컬 랜에 붙어있는 모든 네트워크 장비들에게 보내는 통신
- FFFF.FFFF.FFFF 로 보내주면 랜카드는 비록 자신의 맥 어드레스와 같지는 않지만 브로드캐스트 패킷을 모든 장비가 CPU에 보내줌
- 이렇게 되면 트래픽이 매우 증가함.
- 상대편 맥 어드레스를 찾기 위한 ARP 동작을 위해서 브로드캐스트를 사용

### 멀티캐스트

- 200명 중에 150명만 보내고 싶을 때 사용
- 멀티캐스트는 보내고자 하는 그룹 멤버들에게만 한 번에 보낼 수 있기 떄문에 유니캐스트처럼 여러 번 보낼 필요도 없고, 브로드캐스트 처럼 받기 싫어하는 사람에게 까지 보낼 필요도 없음.
- 스위치나 라우터가 이 멀티캐스트 기능을 꼭 지원해야한다는 제약이 있음

# OSI 7 Layer

- Open System Interconnection
- 복잡한 네트워크 → dvide and conquer
- 층 별 표준화 → 호환성 확보, 비용절감
- 데이터의 흐름 파악 용이, 학습 도구로 활용
- 문제진단 해결 용이
- 통신 편리

![image](https://user-images.githubusercontent.com/37402136/205408103-6b780756-4b69-462a-ab4d-ba8f613e0959.png)

- L4 - L7 : User space
- L2 - L3 : Kernel space
- L1 : Physical space

# Protocol

- 규약
- 네트워크에서의 P 는 대부분이 Protocol임