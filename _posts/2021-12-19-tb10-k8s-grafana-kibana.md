---
layout: post
title: "[K8S] Grafana vs Kibana"
date: 2021-12-19
categories:
  - Kubernetes
tags:
  [
    blog,
    jekyll,
    blog,
    jekyll theme,
    NexT theme,
    지킬 테마,
    지킬 블로그 포스팅,
    GitHub Pages,
  ]
---

# Grafana vs Kibana

`쿠버네티스`에서 서비스를 운영하기 위해서 `모니터링 툴`을 적용해야 했다.

기존 시스템에서는 `ELK 스택` 중 하나인 `Kibana`를 써왔지만, <br>
쿠버네티스 시스템에서는 `Prometheus + Grafana` 스택을 많이들 쓴다고 해서 기존 `Kibana`와 `Grafana`의 차이점에 대해서 알아보았다.

## Kibana

- 로깅 시스템에서의 `시각화 도구`
- Kibana 는 Elasticsearch 및 더 광범위한 ELK Stack에서 통합되어 `다양한 인덱스 데이터`를 검색 및 확인하는데 사용됨.
- 막대 차트, 원형 차트, 표, 히스토그램, 지도 등을 생성할 수 있어 인덱스 데이터의 `시각화`가 간편함.
- 주로 Log Message 분석에 사용됨
- Index를 통해서 Log를 상세하게 분석할 수 있다.

## Grafana

- `시계열 매트릭 데이터 수집`에 강점을 가지고 있다.
- `System info` (CPU, Memory, Disk ...) 등의 메트릭 지표를 시각화하는데 사용된다.
- `알람 기능`이 무료이다.
- 대쉬보드가 위주이다.

## Kibana vs Grafana

### 목적

- Grafana
  - 메시지 로깅에 대한 정보보다는 `시스템의 메트릭`을 확인하는데 더 큰 중점을 가지고 있음.
- Kibana
  - 여러가지 Index 설정을 통해 `메시지의 로그`를 구체적이고 가시적으로 확인하기 위함.

> 어떤 것이 더 낫다고 이야기할 수 있는 부분이 아니다. 서로 다른 목적을 가지고 있는 시각화 툴이다.

> 어떤 팀에서는 Kibana 와 Grafana를 함께 운용하는 팀도 있다. 즉, 목적성에 맞게 사용하는 것이 필요함!
