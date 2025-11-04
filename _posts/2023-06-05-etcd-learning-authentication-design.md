---
layout: post
title: "[etcd] [Docs Learning] etcd v3 authentication design"
date: 2023-06-05
categories:
  - tech/infrastructure
tags: [
    etcd,
    docs,
    learning,
    authentication,
    v3,
    auth,
    client,
    grpc,
    http,
  ]
---

> [etcd 공식 Docs](https://etcd.io/docs/v3.5/learning/) 의 Learning 문서를 보고 공부 및 해석한 내용을 기록합니다.
> 

[Docs](https://etcd.io/docs/v3.5/learning/design-auth-v3/)

https://etcd.io/docs/v3.5/learning/design-auth-v3/

> 한 줄 정리 : RESTful 한 인증 방식인 v2 를 쓰다가, raft 알고리즘을 적용한 v3를 사용했더니 consistency 보장도 좋고, 성능도 좋다!
> 

# Serializable VS Linearizable

- **`Serializable`** 는 **`trasaction`** 개념
    - Single memeber 가 응답
- **`Linearizable`** 은 **`Consistency`** 개념
    - Leader 를 통해서 가져옴
- 선형화 가능 읽기 요청은 가장 최근 데이터를 가져오기 위해 클러스터 멤버의 쿼럼을 거쳐 합의를 도출함. **직렬화 가능 읽기 요청은 오래된 데이터를 제공하는 대가로 멤버 쿼럼이 아닌 단일 etcd 멤버가 제공하므로 선형화 가능 읽기보다 비용이 저렴함**.

# Why not reuse the v2 auth system?

- v3 프로토콜은 v2처럼 RESTful 한 인터페이스가 아닌 gRPC를 사용함
- v2와 비교했을 때 개선점이 많음!
    - 예를 들어,v3는 v2의 느렸던 per-request 인증을 개선한 커넥션 기반 인증을 사용해서 더 빠름
- *(어쨌든 v3가 더 좋음)*

## Functionality requirements

- 커넥션 단위 인증 *(not per request)*
- 기능면에서 v2보다 심플하고 유용함
    - v2처럼 디렉터리 구조를 사용하는 것과는 다르게, v3는 flat key space를 제공한다
- v2보다 훨씬 강력한 `consistency` 를 보장한다.

## Main required changes

- 클라이언트는 인증된 요청을 보내기 전에 `인증만을 위한 전용 커넥션`을 무조건 생성해야함.
- Raft 커맨드에 퍼미션 정보를 추가애햐 함 (유저 ID, 리비전 등)
- 모든 요청은 API 레이어가 아닌 *`state machine* 레이어`에서 퍼미션 체크가 됨.
    - *raft 알고리즘에 state machine 이 있는데 여기서 permission check를 함*

![image](https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/8a45019f-f7f4-4774-a75a-a3caa3266096)

## Permission metadata consistency

- 인증 메타데이터는 etcd에 저장된 다른 데이터들과 마찬가지로 `etcd의 Raft 프로토콜`에 의해서 저장되고 관리 됨
    - 가용성과 일관성에 영향을 주지 않음
- rw 시에 permission info(metadata)를 사용하기 때문에 `SPOF 위험`있음
- 전체 노드의 동의가 필요하다는 것은 가용성에 문제가 있는 것을 의미하기 때문에 인증에도 raft 알고리즘을 사용하면 충분하다
- v2의 경우 일관성 문제 해결하기 위해서 `metadata consistency`가 위와 같이 동작해야하는데, 그렇지 않아서 까다로운 부분이다, 실제로는 각 permission 체크는 client 요청을 받는 etcd 멤버가 수행하기 때문에 오래된 데이터로 인증하는 것이 가능! (server/etcdserver/api/v2http/client.go)
- 이는 운영자가 etcdctl 을 사용했을 때 즉각적으로 `auth conf` 가 적용되지 못하는 것을 의미
    - 그 stale metadata가 얼마나 오래되었는지 알 수가 없음
    - 사실 실제로는 커맨드 실행 시 바로 적용되긴하는데, 큰 부하의 경우 일관성 없는 상태가 지속될 수 있고, 사용자와 개발자에게 직관적이지 못한 결과를 보여줌