---
layout: post
title: "[CISCO 네트워킹] 5. IP 주소로의 여행"
date: 2022-12-17
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
# 5. IP 주소로의 여행

## IP 주소

- 원래는 이진수 `32자리`로 되어 있음. 각 8자리 (십진수로 하면 최대 `255`) 즉, 옥텟 사이에는 점을 찍음
- 인터넷에서 사용되는 프로토콜이 바로 `TCP/IP` 이고, TCP/IP 가 사용하는 주소가 바로` IP 주소`이므로 제대로 이해할 필요가 있음

## 라우터에서의 IP 주소

- 보통 쓰는 라우터에 배정해야 하는 IP 주소는 `두 개`이다. 하나는 `이더넷 인터페이스` 용. 다른 하나는 `시리얼 인터페이스` 용
- 이더넷용은 우리가 부여받은 번호 중에 하나를 쓰는 것
- 시리얼은 우리가 접속하는 ISP 업체에 따라 다르기 때문에 문의해서 써야함

## IP 주소의 구성 (네트워크와 호스트)

- 네트워크는 하나의 브로드캐스트 영역
    - 하나의 PC가 데이터를 뿌렸을 때 그 데이터를 라우터를 거치지 않고 바로 받아볼 수 있는 영역
- 호스트는 각각의 PC 또는 장비라고 생각할 수 있음
    - 모든 PC가 서로 달라야함

### IP 주소의 클래스

- A부터 B, C, D, E 로 구분됨.
- **2개는 빠짐**
    - 하나는 0 으로 가득찬 가작 작은 수 ⇒ `네트워크 자체의 주소`
    - 다른 하나는 제일 큰 수 ⇒ 해당 네트워크의 `브로드 캐스팅`을 위한 것

![image](https://user-images.githubusercontent.com/37402136/208136479-0f6b4deb-9400-49d0-a7c1-ad3fefec1544.png)

- A 클래스
    - 맨 앞이 0으로 시작
    - 하나의 네트워크가 가질 수 있는 호스트 수가 가장 많은 클래스
    - 네트워크 번호가 1-126으로 시작
    - 한 네트워크 안에 들어갈 수 있는 호스트 수 : 16,777,214
- B 클래스
    - 맨 앞이 10 으로 시작
    - 네트워크 번호가 128.1 - 191.255 로 시작
    - 호스트 수 : 65.534
- C 클래스
    - 맨 앞이 110 으로 시작
    - 네트워크 번호가 192.0.0 - 223.255.255 로 시작
    - 호스트 수 : 254
- D 와 E 클래스는 멀티캐스트용과 연구용으로 사용 됨

## 서브넷 마스트

- 서브넷 마스크는 IP 주소에 있어서 매우 중요
- 예를 들어 클래스 B 주소를 받았을 경우 하나의 네트워크가 65000여 개의 호스트를 가지기 때문에 바로 구성하게되면 브로드캐스트의 영향이 너무 큼. 따라서 구분을 하기 위해서 서브넷마스크를 사용함
- **서브넷 마스크는 주어진 IP 주소를 네트워크 환경에 맞게 나누어 주기 위해서 씌워주는 이진수의 조합**
    - → 브로드 캐스트 영역을 나누는 것과 IP 주소를 아끼기 위한 것
- **각각의 서브넷 간의 통신은 라우터를 통해서만 가능함!**
    - 서브넷 마스크를 가지고 나누어서 만들어낸 서브넷도 엄연히 하나의 네트워크니까 서로 간의 통신은 라우터를 통해서만 가능함.
- 서브넷 마스크를 만들 때는 이진수로 봤을 때 여러개의 1사이에 0이 오면 안됨

### 디폴트 서브넷 마스크

![image](https://user-images.githubusercontent.com/37402136/208136510-c741435a-90ca-4e63-ae8e-ebe23b904d69.png)

- 서브넷 마스크는 IP 주소를 가지고 어디까지가 네트워크 부분이고, 또 어디까지가 호스트 부분인지를 나타내는 역할을 함
- 1인 부분은 네트워크, 0인 부분은 호스트
- 기존 IP와 AND 연산을 함
- 주어진 네트워크를 하나도 나누지 않고 그대로 다 쓰는 경우는 디폴트 서브넷 마스크를 사용함. 하지만 주어진 네트워크를 나누어서 쓰는 경우는 디폴트 서브넷 마스크를 수정해서 사용함
- 하나의 주소를 서브넷 마스크를 씌워서 작은 네트워크로 만드는 것을 서브네팅이라고 함

## 서브넷 만들어보기 예시

Q) 공인 IP 주소를 210.100.1.0(서브넷 마스크 255.255.255.0) 네트워크를 받았습니다. 그런데 네트워크 관리자인 여러분은 이 공인 주소를 이용해서 PC가 30대인 네트워크를 최소 4개 이상 만든 후 이들 네트워크를 라우터를 이용해서 서로 통신하게 하려고 합ㄴ디ㅏ. 이 경우 여러분이 서브넷 마스크를 만든다면 어떻게 해야할 까요?

⇒ 

- 해당 네트워크는 C 클래스 네트워크임.
- 이 주소로 네트워크를 최소 4개 이상 만들려면 주어진 디폴트 서브넷 마스크 변경이 필요함
- 호스트가 30개가 되기 위해서는 이진수가 5자리가 필요함
    - 호스트 부분이 모두 0 이거나 모두 1인 경우는 못쓰니깐 2를 빼줘야함
    - 2^(호스트 비트 수) - 2
- 즉, 210.100.1.ssshhhhh 가 되어야 함
    - → 255.255.255.1110 0000(224) 의 서브넷 마스크를 사용해야함

![image](https://user-images.githubusercontent.com/37402136/208136552-47578caa-73bd-451c-942b-bed05e3cb4d4.png)

Q) 받은 공인 주소는 201.222.5.0(255.255.255.0) 이고 고객이 원하는 것은 이 주소를 잘라서 20개 이상의 작은 네트워크를 만드는데, 한 네트워크가 최소한 5개의 호스트를 가져야 한다. 

⇒

- 호스트가 5개가 되기 위해서는 최소 3비트가 필요함
- 255.255.255.1111 1000
- 
![image](https://user-images.githubusercontent.com/37402136/208136610-c2a2058b-d013-43d9-967b-77fe696a883e.png)
