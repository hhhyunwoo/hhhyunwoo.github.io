---
layout: post
title: "[CISCO 네트워킹] 12. IPv6 로 떠나는 여행"
date: 2023-05-29
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

## IPv6 의 필요성

- IPv4 주소의 ***주소공간 부족***
    - IPv6는 IPv4 와 엄청난 양의 주소 차이가 남

### NAT

- `Network Address Translation`
- 내부에서는 Private IP 주소, 외부에서는 공인 IP 주소를 사용할 수 있게 하는 것

### Subnet

- 서브넷 마스크를 이용해서 네트워크를 ***잘게 쪼게서 사용하여 주소를 아낌***

## IPv6의 주요 특징

- IP 주소 범위
    - 32 bit → `128 bit`
- IP 주소의 자동 구성
    - `Stateless Auto Configuration` 를 사용하여 어떤 장비든 네트워크에 접속만 되면 자동으로 주소를 구성할 수 있음
- 보안
    - `IPSec`이 **디폴트**라서 어디서나 보안을 적용할 수 있음
- Mobility
    - 더 효과적이고 간편함
- 브로드캐스트
    - 브로드캐스트가 없어지고, `멀티캐스트`가 그 역할을 대신 함
    - 브로드캐스트는 이전에 ***필요악이었음.***
- 16진수를 사용함
    - 2001:0db8:010f:0001:0000:0000:0000:0d0c
- 브로드 캐스트가 사라지고 애니케스트가 생김
    - 아무나 제일 먼저 받는 녀석이 임자가 되는 형태