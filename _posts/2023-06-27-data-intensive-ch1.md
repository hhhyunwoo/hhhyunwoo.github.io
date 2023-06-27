---
layout: post
title: "[데이터 중심 애플리케이션 설계] Ch1. Reliable, Scalable, and Maintainable Applications"
date: 2023-06-27
categories:
  - Study
  - Book
  - Designing Data Intensive Application
tags: [
    data,
    data-intensive,
    맷돼지책,
    study,
    book,
    reliable,
  ]
---
오늘날 많은 애플리케이션은 `Compute-Intensive` 와는 다르게 `Data-Intensive` 적이다. 

즉, CPU 성능보다는 데이터의 양, 데이터의 복잡도, 데이터의 변화 속도가 더 큰 문제이다.

일반적인 데이터 중심 애플리케이션은 아래와 같은 컴포넌트들이 필요하다.

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/7f8ee226-8a36-4749-adc3-cbb67d4840a5)

- Database
- Cache
- Search Index
- Stream Processing
- Batch Processing

이러한 시스템을 위한 여러 도구들은 다양한 Use Case 에 최적화됐기 때문에 더 이상 전통적인 분류에 딱 맞지 않다. 예를 들어 **Kafka** 와 **Redis** 는 데이터를 다루는 도구이지만, 사용되는 목적이 전혀 다르다. 

따라서 이러한 도구들을 엔지니어링 관점에서 신중하게 `신뢰성`, `확장성`, `유지보수성`을 고려하여 사용해야한다! 

**이번 장에서는 신뢰성, 확장성, 유지보수성에 대해서 자세히 알아보자** 

<br>

# Reliability

소프트웨어에 대한 사용자의 일반적인 기대치는 아래와 같다.

- 사용자가 기대한 기능을 수행
- 사용자의 실수나 예상치 못한 사용법을 허용
- 성능은 필수적인 사용 사례를 충분히 만족
- 허가되지 않은 접근과 오남용을 방지

즉, 이 모든 것들은 `올바르게 동작함`을 의미한다.

→ **무언가 잘못되더라도 지속적으로 올바르게 동작함**

## Fault

잘못될 수 있는 일을 fault 라고 부른다. 

### Fault Tolerant (or Resilient)

- 결함을 예측하고 대처할 수 있는 시스템을 의미
- 하지만 모든 결함을 견딜 수 있는 시스템은 불가능함! (ex. 블랙홀)

### Failure 와 Fault 의 차이

- 장애는 사용자에게 필요한 서비스를 제공하지 못하고 시스템 전체가 멈춘 경우
- 결함은 사양에서 벗어난 시스템의 한 구성 요소

### Chaos Monkey (chaos engineering)

- 고의적으로 결함을 유도해서 내결함성 시스템을 지속적으로 훈련하고 테스트하는 방법
- [넷플릭스](https://github.com/Netflix/chaosmonkey)에서 이런식으로 수행함

## Hardware Faults

일반적인 디스크 고장, 메모리 고장 등과 같은 이슈들을 말함

*(하드디스크의 평균 장애시간은 10~50년인데, 이는 10,000개의 디스크로 구성된 클러스터에서 평균적으로 하루 1개의 디스크가 죽는다는 의미)*

아래의 방법으로 장애율을 줄일 수 있음

- RAID 구성
    - Redundant Array of Independent DIsk
    - 인프라를 구축할 때 여러 개의 Disk 를 묶어서 사용하는 기법
- 이중 전원 디바이스와 Hot-swap 가능한 CPU 사용
- 데이터센터의 건전지와 예비 전원용 디젤 발전기 갖추기

## Software Errors

하드웨어의 결함은 무작위적이고 독립적이라고 생각하지만, 소프트웨어는 그렇지 않음. 

소프트웨어의 오류 문제는 신속한 해결책이 없다. 따라서 `빈틈없는 테스트`, `프로세스 격리`, `재시작 허용`, `모니터링`, `분석하기` 등의 방법이 도움이 될 수 있음 

## Human Errors

- 잘 설계된 추상화, API …
- Sandbox 사용
- 철저한 테스트 (corner case)
- 빠른 Roll back and Roll out
- 모니터링
- 조작 교육과 실습

<br>

# Scalability

확장성을 논한다는 것은 **“X는 확장 가능하다”** 가 아니라 `“시스템이 특정 방식으로 커지면 이에 대처하기 위한 선택은 무엇인가?”` 와 `“추가 부하를 다루기 위해 계산 자원을 어떻게 투입할까?”` 같은 질문이다. 

## Describing Load

### Load Parameter

부하는 `부하 매개변수`라고 부르는 몇 개의 숫자로 나타낼 수 있다. 

- 웹 서버의 초당 요청 수
- 데이터베이스의 읽기 대 쓰기 비율
- 대화방의 Active User 수
- 캐시 적중률

### Twitter 의 예시

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/9b27544a-2739-477d-af2a-03b925aae9d9)

- **트윗을 작성하는 것**보다 **조회하는 요청**이 수백 배 많음!
- 따라서 트윗을 작성할 때 1번처럼 홈에서 트윗을 읽을 때마다 일치하는 값들을 조회하는 것이 아니라, 2번처럼 트윗 작성 시에 유저들의 데이터 리스트에 삽입을 해주는 것이 더 효율적!
- 하지만 `Worst Case` 처럼 **Follwer 가 3천만명이 넘는 경우**는….?
    - → 1번 방식을 Hybrid 로 사용!

## Describing Performance

시스템 부하를 기술하면 부하가 증가할 때 어떤 일이 일어나는지 조사할 수 있음.

- 부하 매개변수를 증가시키고 시스템 리소스는 유지하면 어떤 영향을 받나?
- 부하 매개변수를 증가시켰을 때 성능이 변하지 않고 유지되길 원한다면 자원을 얼마나 늘려야 하는가?

이를 위해서는 `성능 수치`가 필요함!

### Throughput

- Hadoop 같은 배치 처리 시스템은 보통 초당 처리할 수 있는 레코드 수나 일정 크기의 데이터 집합으로 작업을 수행할 때 걸리는 시간에 관심을 가짐

### Response Time

- 온라인 시스템에서는 클라이언트가 요청을 보내고, 응답을 받는 사이의 시간이 더 중요함
- `Latency` vs `Response Time`
    - Latency 는 요청이 처리되길 기다리는 시간.
    - Response Time 은 클라이언트 관점에서 본 요청 처리 실제 시간

### 값이 아닌 분포로 생각하기

**클라이언트가 몇 번이고 반복해서 동일한 요청을 하더라도 매번 응답 시간은 다름!!** 따라서 응답 시간은 단일 숫자가 아니라 `분포` 값으로 생각해야함! 

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/bb102699-a92f-4ca9-8d96-421bbe583295)

위의 그래프에서 볼 수 있듯이 동일 요청에서도 Outlier가 존재함. 아래의 다양한 변수 때문

- 백그라운드 프로세스의 Context Switching
- 네트워크 패킷 손실과 TCP 재전송
- Garbage Collection Pause
- Disk IO Page Fault
- 서버 랙의 기계적인 진동

전형적인 응답 시간을 알고 싶다면 `산술 평균` 을 사용하는 것은 좋은 지표는 아니고, 일반적으로 평균보단 `백분위`를 사용하는 편이 좋음

### Tail Latency

아마존의 예시!!

- 99.9 분위 (즉, 1000건의 요청 중 가장 느린 1건)을 최적화 하는 작업은 좋은 결과를 가져왔음.
- 보통 응답 시간이 가장 느린 요청을 경험한 고객들은 가장 많은 구매를 하는 고객들이었음.
- 하지만 99.99분위 (10,000 건의 요청 중 가장 느린 1건) 을 최적화하는 작업은 비용 대비 충분한 이익이 없었음

### SLO와 SLA

- SLO (Service Level Objective)
- SLA (Service Level Agrement)
- 백분위는 위의 값에 자주 사용 됨.
- 예시.
    - 응답 시간 중앙값이 200밀리초 미만이고, 99분위가 1초 미만인 경우 정상 서비스 상태로 간주하며 서비스 제공 시간은 99.9% 이상이어야 한다.

## Approches for coping with Load

> **One-Size-Fits-ALL 확장 아키텍쳐는 없다!**
> 

아키텍쳐를 결정하는 요소는 `읽기의 양`, `쓰기의 양`, `저장할 데이터의 양`, `데이터의 복잡도`, `응답 시간 요구사항`, `접근 패턴` 등이 있다. 

- 이에 맞게 Scale up, out, elastic 하게 아키텍처를 자주 재검토 해줘야 함

<br>

# Maintainability

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/1138ce35-2844-4a01-942a-ea01ae0cc88b)

- 이상적인 소프트웨어 엔지니어링 workload 차트

**소프트웨어 비용의 대부분은 초기 개발이 아니라 지속해서 이어지는 유지보수에 들어간다.** 

유지보수는 필수불가결하지만, 유지보수의 고통을 최소화 하고 레거시를 만들지 않게끔 소프트웨어 설계는 가능하다. 

이를 위한 원칙 `세 가지`는 아래와 같다. 

## 운용성: 운영의 편리함 만들기

시스템이 지속해서 원활하게 작동하려면 운영팀이 필수! 좋은 운영팀은 일반적으로 다음과 같은 작업 등을 책임짐

- 시스템 모니터링 + 서비스 복원
- 장애, 성능 저하 원인 추적
- 보안 패치 등 최신 상태로 유지
- 배포, 설정 관리 등을 위한 도구 마련
- 보안 유지보수
- 운영 및 서비스 유지를 위한 절차 정의
- 개인 인사 이동에도 시스템에 대한 조직의 지식을 보존

## 단순성: 복잡도 관리

복잡도는 다양한 증상으로 나타남. `상태 공간의 급증`, `모듈 간 강한 커플링`, `복잡한 의존성`, `일관성 없는 명명과 용어`, `성능 문제 해결을 목표로 한 해킹`, `임시방편으로 문제를 해결한 특수 사례` 등 

→ 이를 해결하기 위한 최상의 도구는 **추상화**! 

좋은 추상화는 깔끔하고 직관적인 괴관 아래로 많은 세부 구현을 숨길 수 있고, 재사용이 가능!! 

예시.

- 고수준 프로그래밍 언어는 기계 언어, CPU 레지스터, 시스템 호출을 숨긴 추상화임.
- SQL 은 디스크에 기록하고 메모리에 저장한 복잡한 데이터 구조를 숨긴 추상화

## 발전성: 변화를 쉽게 만들기

Agile 작업과 TDD, Refactoring 은 자주 변화하는 환경에서 도움이 됨. 

**데이터 시스템 수준에서 민첩성을 언급할 때는 민첩성 대신 다른 단어로 발전성을 사용할 예정!** 

<br>

## Reference

- https://www.semanticscholar.org/paper/Research-on-Software-Maintenance-Cost-of-Influence-Ren-Xing/c937040f76a3cbab2d0eb3a6eaabda97c55160a3
- https://github.com/jeffrey-xiao/papers/blob/master/textbooks/designing-data-intensive-applications.pdf