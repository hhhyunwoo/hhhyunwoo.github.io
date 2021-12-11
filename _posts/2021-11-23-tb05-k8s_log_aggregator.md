---
layout: post
title: "[K8S] 쿠버네티스(K8S)에서의 Log Aggregator, Logstash vs Fluentd"
date: 2021-11-23
categories:
  - K8S
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

# 쿠버네티스(K8S)에서의 Log Aggregator, Logstash vs Fluentd

## Log Aggregator (로그 수집기) 란?

> 거의 대부분의 서비스에서는 디버깅을 위한 로그 수집은 필수적이다.
> <br>ELK 스택으로 로그 수집 및 시각화를 많이 하곤 한다.

- ELK
  - Elastic Search
    - Apache Lucene 기반의 Java 오픈소스 분산 검색 엔진
    - 방대한 양의 데이터를 신속하게 (Near Real Time)으로 저장, 검색, 분석할 수 있다.
  - Logstash
    - Elastic 에서 만든 오픈 소스 서버측 데이터 처리 파이프라인
  - Kibana
    - 로그 수집기로부터 데이터를 받아 시각화할 수 있는 오픈소스

---

## Kubernetes에서의 Logging

> 가장 쉽고 가장 널리 사용되는 로깅 방법은 표준 출력과 표준 에러 스트림에 작성

_하지만 표준출력으로는 완전한 로깅이 불가능하다_

-> 컨테이너가 크래시되거나, 노드가 종료된 경우에도 애플리케이션의 로그에 접근해야한다. 따라서 클러스터에서 로그는 노드, 파드 또는 컨테이너와는 독립적으로 별도의 스토리지와 라이프사이클을 가져야 한다. 이를 클러스터-레벨-로깅이라고 한다.

---

## Logstash vs Fluentd

> Kubernetes에서의 로그 수집은을 할 떄는 어떤 툴을 사용할까?
> 상황에 따라 다르지만 Fluentd가 더 매력적인 부분들이 많다.

- **Fluentd는 Treasure Data에 의해 구축되었고 CNCF의 일부이다.**
  - CNCF : Cloud Native Computing Foundation은 컨테이너 기술을 발전시키고 기술 산업이 발전할 수 있도록 지원하기 위해 2015년에 설립된 Linux Foundation 프로젝트
  - Kubernetes나 Cloud 환경에서 더 Support가 잘 되고 있음
- **Docker에서 Fluentd를 위한 build-in logging driver를 가지고 있다.**
  - 이를 통해 Fluentd를 사용하면 다른 로그 파일 도움없이 직접적으로 STDOUT 을 내보낼 수 있다.
  - Logstash는 Filebeat와 같은 플러그인을 이용해야만 가능

_[전체적인 차이점을 보고 싶다면 여기를 참고](https://platform9.com/blog/kubernetes-logging-comparing-fluentd-vs-logstash/)_
<br>

`Logstash, Fluentd 각각 장단점이 있지만 Kubernetes와 같은 Cloud환경에서는 Fluentd가 더 적합한 것 같다. `
