---
layout: post
title: "[etcd] [Docs Learning] etcd versus other key-value stores"
date: 2023-06-26
categories:
  - tech/infrastructure
tags: [
    etcd,
    docs,
    learning,
    kv,
    api,
    keyvalue,
  ]
---
> [etcd 공식 Docs](https://etcd.io/docs/v3.5/learning/) 의 Learning 문서를 보고 공부 및 해석한 내용을 기록합니다.
> 

[Docs](https://etcd.io/docs/v3.5/learning/why/)

**etcd** 는 `/etc` + `distritubed system` 에서 유래했으며, configuration 데이터를 저장하기 위해서 만들어졌는데 여기다가 분산시스템을 더해서 etcd가 되었다!

**network partition 을 절대 허용하지 않으며, 가용성을 기꺼이 희생함**

## Use cases

- Container Linux by CoreOS
    - Locksmith 에서 etcd 를 사용해서 `분산 세마포`를 구현해서 클러스터의 하위 집합만 리붓되도록 함
- Kuberentes 에서 데이터를 저장하기 위해 사용됨

## Comparison chart

<img width="1624" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/a8909558-e45b-410f-81e1-e0bb97a5db97">

### ZooKeeper

- `distributed system coordination` and `metadata storage` 를 해결
- etcd가 **zookeeper** 에서 구현된 좋은 점들을 많이 사용함
- `자체 RPC 프로토콜`을 사용하는데, 언어 등등 **불편한 부분**이 많음
- zookeeper 고려하는 사람들! **etcd 써라**

### Consul

- **Service Discovery**란?
    - MSA 환경에서 서비스 간 호출이 잦음. 근데 클라우드 환경에서는 컨테이너 기반이기 때문에 서비스의 IP가 동적으로 변경되는 일이 많다.
    - 이때 서비스 클라이언트가 서비스를 호출할 때 서비스의 위치 (즉, IP주소와 포트) 를 알아낼 수 있는 기능이 필요한데, 이것이 `Service Discovery` 임.
- e2e service discovery framework
- consul 1.0 에서 scale out 이 안됨
- **etcd 와는 다른 문제를 푸는 플랫폼인데, e2e cluseter service discovery 를 찾는다면 consul 도 괜찮은 선택!**

### NewSQL (Cloud Spanner, CockroachDB, TiDB)

- data center 끼리의 horizontally scale out 을 의도한 DB 들
- 몇 GB 이상의 데이터를 저장하거나, full SQL 쿼리가 필요하면 NewSQL 써라

## Using etcd for metadata

응용프로그램이 프로세스를 조정하는 것과 같이 메타데이터 또는 메타데이터 순서를 주로 고려하는 경우 등을 선택. 

애플리케이션에 여러 데이터 센터에 걸쳐 대규모 데이터 저장소가 필요하고 강력한 글로벌 주문 속성에 크게 의존하지 않는 경우 `NewSQL 데이터베이스`를 선택

## Using etcd for distributed coordination

이론적으로, 강력한 일관성을 제공하는 모든 스토리지 시스템 위에 이러한 기본 요소를 구축할 수 있지만, 알고리즘은 조금 미묘하다. 작동하는 것처럼 보이는 Lock 알고리즘을 개발하는 것은 쉽지만 갑작스럽게 중단될 수 있음. 

게다가, 트랜잭션 메모리와 같은 etcd에 의해 지원되는 다른 기본 요소들은 etcd의 MVCC 데이터 모델에 의존한다. 즉, 단순한 강한 일관성으로는 충분하지 않음

`Distributed Coordination` 의 경우 etcd를 선택하면 운영상의 문제를 예방하고 엔지니어링 작업을 절약할 수 있음!