---
layout: post
title: "[etcd] [Docs Learning] KV API Guarantees"
date: 2023-06-12
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

[Docs](https://etcd.io/docs/v3.5/learning/api_guarantees/)

# APIs to consider

- **`Read`** APIs
    - range
    - watch
- **`Write`** APIs
    - put
    - delete
- **`Combination`** (read-modify-write) APIs
    - txn
- **`Lease`** APIs
    - grant
    - revoke
    - put (attaching a lease to a key)
- **`Watch`** operation
    - [Reference 1](https://etcd.io/docs/v3.5/tutorials/how-to-watch-keys/)
    - [Reference 2](https://etcd.io/docs/v3.4/dev-guide/interacting_v3/#watch-key-changes)
    - 말그대로 `client` 에서 `etcd 의 특정 key`를 **watching** 하는 것 !

# etcd specific definitions

### Operation completed

- consensus 를 통해서 `commit` 이 되어야 etcd operation이 끝났다고 볼 수 있음
    - → **executed**
- client 는 **etcd server** 로부터 `response`를 받음으로서 *complete 을 알 수 있다*.
    - 근데 client 는 etcd server 에 time out 이 생긴지 혹은 **멤버간의 network disruption 이 생겼는지 확신할 수 없음**.
    - etcd 는 client 에게 “`abort` “ 응답을 보내지 않는다.

### Revision

- Modifying key value store 은 **single increasing revision** 하게 함
- 하나의 transaction이 여러개의 key 값을 바꾸더라도 `revison`은 하나만 올라감
- 오퍼레이션에 의해 수정된 KV Pair 의 revision 속성은 해당 오퍼레이션의 revision 값과 동일

# Guarantees provided

**ACID** 보장 (`Atomicity`, `Consistency`, `Isolation`, `Durability`) 

### Atomicity

- `abortability` 로 불릴 수 있음. **완벽하게 취소가 가능함!!**
- `1` or `nothing` 으로 함. **중간은 절대 없음**. 완벽하게 되돌릴 수 있음
- redis 는 partial failure 가 있음.. `atomicity` 보장해주지 않음.
- **All API requests are `atomic`**
- Watch 의 경우에 한 오퍼레이션에 포함된 이벤트들을 부분적으로 관찰하지 않음.

### Durability

- **모든 완료된 동작**은 `durable` 함
- **접근 가능한 데이터**는 모두 durable 함
- **READ**는 **durable 하지 않은 데이터는 절대 return 하지 않음**
    - **→ 멤버가 하나뿐이라면 data return (read) 못함. 근데 Serializable 옵션을 주면 Read 가능함!**

### Isolation level and consistency of replicas

- etcd ensured **strict** `serializability`
    - 분산 트랜잭션 데이터베이스 시스템에서 가장 강력한 **isolation guarantee** 임
    - **read 는 절대 중간 데이터를 관찰하지 않음**
        - https://jepsen.io/consistency/models/strict-serializable
    - `serializability` 가 강해지면 **분산 시스템의 의미가 약화됨**.
        - → 왜냐하면 **병렬성을 존중해주지 않고 순서를 정해버리기 때문**.
- etcd ensures `linearizability` as **consistency of replicas basically**
    - 복제본의 일관성으로 **linearizability 를 보장함**
    - serializable 가능 옵션을 명시적으로 지정하는 `watch` 와 `read` 는 예외임
        - https://cs.brown.edu/~mph/HerlihyW90/p463-herlihy.pdf
- client 측면에서 **linearizability 는 추론을 쉽게할 수 있게 해줌**
    - **t1 쓰기, t2 읽기의 상황**에서 t2 라는 읽기 요청 시점과 읽기에 대한 응답이 오는 t3. 즉, t2 ~ t3 시간 사이에 어떤 사건이 발생할 수도, 아닐 수도 있음.
    - 사건이 없는 경우에는 t1이 최신 사건이 될 것이고 읽기 응답에 포함되어야 함.
    - 근데, t1이후 t2 ~ t3 에 벌어진 사건이 추가로 있다면 응답에 포함해주는 것이 `Linearizability` 를 보장해주는 것임!
    - → ***이렇게 Linearizability 가 보장되면 사용자는 시스템의 응답이 최신이라고 믿고 사용할 수 있음. 반면 보장이 안된다면 응답 결과가 오래 된 값 (Stale) 이라고 의심하고 다루어야 함.***
- etcd 의 `Watch` 에서는 `linearizability` 를 보장하지 않음
    - **성능 때문임**. k8s 같은 경우 엄청 많은 operator 들이 watch 걸어두고 보고 있는데, 여기서 raft 태워서 리턴을 하게되면 성능이 엄청 떨어짐
    - 그래서 `watch` 같은 경우는 Client 가 Revision(monotoni clock) 을 가지고 잘 판단해서 데이터 읽어서 써라! 라는 의미임.
- 다른 operation 에서는 기본적으로 **linearizability** 를 보장함. **linearized requests 는 raft 합의 프로세스를 거쳐야 하기때문에 이게 좀 비쌈.**
    - read 에서 lower latencies and higer throughput 를 얻으려면 client 는 serializable 모드로 사용하면 됨
        - 요건 근데 쿼럼과 관련해서 stale data 에 접근할 수도 있지만 성능저하가 사라짐
    - 그럼 client 접근은 랜덤일까?

# Granting, attaching and revoking leases

- etcd provides a lease mechanism
    - https://web.stanford.edu/class/cs240/readings/89-leases.pdf