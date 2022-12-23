---
layout: post
title: "[CISCO 네트워킹] 6. 스위치를 켜라"
date: 2022-12-23
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
# 6. 스위치를 켜라!

## 스위치

- 허로 만들어진 `콜리전 도메인` 사이를 반으로 나누고 중간에 다리를 놓아서, `CSMA/CD 문제`를 해결함

## 스패닝 트리

- 스위치나 브리지에서 발생하는 `Looping` 을 막아주기 위한 프로토콜
    - 출발지부터 목적지까지의 경로가 2개 이상 존재할 때 1개의 경로만을 남겨두고 나머지는 모두 끊어두었다가, 사용하던 경로에 문제가 발생하면 그 때 끊어두었던 경로를 하나씩 살림

### Bridge ID

- 브리지의 `ID`
- `Bridge Priority` (16bit) + `MAC Address` (48bit)
- Bridge Priority
    - 0 ~ 65535
    - default : 중간 값 32768 == 8000

### Path Cost

- 브리자가 얼마나 가까이 그리고 빠른 링크로 연결되어 있는지를 알아내기 위한 값
- 기본적으로는 1,000Mbps 를 두 장비 사이의 링크 대역폭으로 나눈 값을 사용했음
- 소수 점이 나오면서 표준 값이 생김

### 스패닝 트리의 프로토콜

1. 네트워크 당 하나의 `Root Bridge` 를 가진다
    - 네트워크는 스위치나 브리지로 구성된 하나의 네트워크를 의미함. 따라서 라우터에 의해 나누어지는 브로드캐스트 도메인이 하나의 네트워크라고 볼 수 있음
    - Root Bridge 는 대장 브리지로 볼 수 있음. 스패닝 트리 프로토콜을 수행할 때 기준이 되는 브리지
2. Root Bridge 가 아닌 나머지 모든 브리지는 무조건 하나씩의 `Root Port` 를 가진다
    - Root Port 는 루트브리지에 가장 빨리갈 수 있는 포트를 말한다.
3. 세그먼트 당 하나씩의 `Designated Port` 를 가진다
    - 쉽게 말해 지정포트
    - 세그먼트는 브리지 또는 스위치 간에 서로 연결된 링크라고 볼 수 있음

![image](https://user-images.githubusercontent.com/37402136/209356716-c744fd3d-f51d-40a0-85a2-2df6a16e681e.png)

### STP 에서 Root Bridge 뽑기

- 무조건 `낮은 BID`를 갖는 브리지가 대장이 됨

### STP 에서 루트포트와 데지그네이티드 포트 정하기

1. 누가 더 작은 `Root BID`를 가졌는가?
2. Root Bridge 까지의 `Path Cost` 값은 누가 더 작은가?
3. 누구의 `BID(Sender BID)`가 더 낮은가?
4. 누구의 `Port ID`가 더 낮은가?
- `BPDU`
    - Bridge Protocol Data Unit
    - 루트 브리지의 BID인 Root BID, Root Path Cost, Sender BID 그리고 Port ID 등의 정보가 실려있음
    - 스패닝 트리 정보를 브리지끼리 주고 받기 위해서 사용하는 특수한 프레임
    - 브리지나 스위치가 부팅을 하면 이들은 각각의 포트로 BPDU를 매 2초마다 내보내면서 서로의 스패닝  트리 정보를 주고 받게 된다.

### STP의 5가지 상태 변화

- `Disabled`
    - 포트가 고장나서 사용할 수 없거나 네트워크 관리자가 포트를 일부러 닫아놓은 상태
    - 데이터 전송 X
    - MAC 배우기 X
    - BPDU 주고받기 X
- `Blocking`
    - 스위치를 맨 처음 켜거나, Disabled 되어 있는 포트를 살렸을 때
    - 데이터 전송은 되지 않고 오직 BPDU 만 주고받을 수 있음
    - 데이터 전송 X
    - MAC 배우기 X
    - BPDU 주고받기 O
- `Listening`
    - 블로킹 상태에 있던 스위치 포트가 루트 포트나 데지그네이티드 포트로 선정되면 포트는 바로 리스닝 상태로 넘어감
    - 데이터 전송 X
    - MAC 배우기 X
    - BPDU 주고받기 O
- `Learning`
    - 리스닝 상태에 있던 스위치 포트가 포워딩 딜레이 디폴트 시간인 15초 동안 그 상태를 유지하면, 리스닝 상태는 러닝 상태로 넘어감
    - 비로소 MAC 을 배워서 Table을 만듬
    - 데이터 전송 X
    - MAC 배우기 O
    - BPDU 주고받기 O
- `Forwarding`
    - 스위치 포트가 러닝 상태에서 다른 상태로 넘어가지 않고, 포워딩 딜레이 디폴트 시간인 15초 동안 유지하면 포워딩 상태로 넘어감
    - 즉, 블로킹에서 포워딩으로 가려면 30초가 소요됨
    - 데이터 전송 O
    - MAC 배우기 O
    - BPDU 주고받기 O

### 실습

![image](https://user-images.githubusercontent.com/37402136/209356740-6365610f-ab99-440f-b325-00aa6d44d293.png)

### 스패닝 트리에 변화가 생기면?

- `Hello Time`
    - 루트 브리지가 얼마 만에 한번 씩 헬로 BPDU를 보내는지에 대한 시간
    - 디폴트는 2초
- `Max Age`
    - 브리지들이 루트 브리지로부터 헬로 패킷을 받지 못하면 맥스 에이지 시간 동안 기다린 후 스패닝 트리 구조 변경을 시작함
    - 즉, 특정 시간이 지나면 루트 브리지가 죽었다고 생각하고 새로운 트리를 만드는 것임
    - 디폴트 20초
- `Forwarding Delay`
    - 브리지 포트가 블로킹 상태에서 포워딩 상태로 넘어갈 때까지 걸리는 시간

## VLAN

- 스위치는 단순히 콜리전 영역을 나눠주는 역할 뿐만 아니라 라우터 없이 브로드캐스트 도메인을 나눌 수 있는 `VLAN 기능`을 제공함
    - 즉, 한 대의 스위치를 마치 여러대의 분리된 스위치처럼 사용하고, 또 여러 개의 네트워크 정보를 하나의 포트를 통해 전송할 수 있음
    - 가상 랜을 이용하면 하나의 스위치에 연결된 장비들도 브로드캐스트 도메인이 서로 다를 수 있음

![image](https://user-images.githubusercontent.com/37402136/209356756-4ef98a26-832c-434d-afdc-9b1b351c7750.png)

- 한 스위치에 붙어 있는 2번 3번 VLAN 네트워크끼리 통신하려면 반드시 라우터를 거쳐서만 가능함. 아무리 같은 스위치에 붙어있다고 하더라도 `네트워크가 다르기 때문에 통신이 불가능`함

### 트렁킹

- 여러 개의 `VLAN` 들을 한 번에 전송하는 방식
- ISL 방식
    - CISCO에서 만듬
- IEEE 802.1Q 방식
    - 표준
    - Native VLAN이 존재
        - 이름표가 붙지 않은 VLAN

### VTP

- VLAN Trunking Protocol
- 스위치들 간에 VLAN 정보를 서로 주고받아 스위치들이 가지고 있는 VLAN 정보를 항상 일치시켜 주기 위한 프로토콜
- 시스코만의 프로토콜

### VLAN 에 대한 정보

1. VLAN에 대해 아무것도 세팅하지 않았을 때도 `Default VLAN`은 이미 세팅이 되어 있음. VLAN 1 이 디폴트 VLAN으로 최초에 모든 포트가 다 `VLAN 1`에 속해 있음 
2. 각 스위치 마다 만들 수 있는 VLAN의 개수는 모두 `다름`
3. 스위치의 IP 주소 세팅은 `VLAN 1`에 진행함

ref. 
https://medium.com/humanscape-tech/스위치-스패닝트리-d6c1966aca94
https://winyong.tistory.com/47
http://trac.gateworks.com/wiki/linux/vlan