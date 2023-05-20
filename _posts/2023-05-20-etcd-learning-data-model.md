---
layout: post
title: "[etcd] [Docs Learning] Data Model"
date: 2023-05-20
categories:
  - etcd
  - docs
tags: [
    etcd,
    docs,
    learning,
    data model,
    data structure,
  ]
---

> [etcd 공식 Docs](https://etcd.io/docs/v3.5/learning/) 의 Learning 문서를 보고 공부 및 해석한 내용을 기록합니다.
> 

# Data Model

> "A persistent, multi-version, concurrency-control data model"
> (유지되고, Multi version 이면서, 동시성 컨트롤이 되는 데이터 구조)

> "etcd is designed to **reliably store *infrequently* updated data** and **provide reliable watch queries**."
> (etcd 는 빈번하지 않게 데이터를 업데이트하고 안정석있는 watch 쿼리를 위해 디자인 되었음)

> etcd exposes previous versions of key-value pairs to **support inexpensive snapshots** and **watch history events** ("time travel queries").


## etcd data storage methodologies

- `모든 과거의 key` 들은 **접근 가능**하고 **수정 이후에도 확인 가능함**

### Persistent data structure

- **Persistent data structure**(*or not ephemeral data structure*) 는 수정이 되었던 모든 버전의 데이터를 보존하는 자료 구조를 의미함
- Persistent 하지 않은 구조는 *`ephemeral`* 이라고 부름
- ref. [https://en.wikipedia.org/wiki/Persistent_data_structure](https://en.wikipedia.org/wiki/Persistent_data_structure)

## Logical View

- 저장소의 `Logical view` 는 `binary key space` 이다.
- Key 공간들은 **lexically sorting** 되어있어서 range 쿼리에 유리함
    - **lexicographic sorting :** 사전식 정렬
- key 공간은 여러개의 revision을 유지함. 맨처음의 revision은 1이고, 여러개의 연산이 묶인 trasaction (transaction 을 하나의 단위로 봄) 단위로 revsion은 monotonically 하게 증가한다.
    - **삭제되면 0으로 revision이 바뀜**
- `Compaction`이 수행되면 compaction revision 전에 종료된 모든 생성이 제거되고, 최신 생성을 제외하고 compaction revision 전에 설정된 값들이 제거됨

## Physical View

### B+tree vs B Tree

- `B+Tree` 는 leaf node에만 데이터를 저장하고 다른 노드에는 key 만 저장함.
- 반면에 `B Tree` 는 모든 노드에 데이터를 저장함
- → B+Tree 가 key를 더 많이 가지고 있을 수 있다.

<img width="1002" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/2736976a-2bbb-415b-ab76-9027d66a21a8">

- (파란색 블록이 원래는 B Tree임.) B Tree 는 User interface 임.
    - 사용자 -> B Tree 의 key -> revisions -> B+Tree 의 revision -> value
    - Pointer 구조!
- `B+Tree` 를 사용하면 **Compaction 에 유리**하고, **range lookups 가 빠름** (lexical order)
- **실제 데이터는 B+Tree 에 저장됨**
    - 각 저장소의 revision은 이전 revision과의 delta (변경분) 만 저장을 함.
    - single revision은 multiple keys 와 동일할 수 있다.

### Snapshot Isolation (SSI) => MVCC (Multi-Version Concurrency Control)

- Lock 메커니즘
- Vertical scaleup 이 아니라 horizontal 하게 scale up 하게 되면서 분산 시스템에서 데이터의 consistency 유지는 정말 중요함. 근데 그 부분은 예전부터 대두되던 문제이다.
- 그 해결책으로 그나마 최근에 이야기가 나오는 해결 방법!
    - 특정 키에 대한 버전을 여러개 계속 append 함. 그럼 consistency 에 대한 추적과 update 가 필요없음!
- Read 에 유리하다
- SSI
    - Lock 은 어떻게 잡는가?
    - Optimistic Lock
        - k8s 에서만 봐도 명세를 많은 리소스들이 접근함. revision 값 (수정 시간) 을 통해서 데이터의 immutable 을 보장함
- Revision
    - 서버마다 time 은 다르기 때문에 monotonical clock 인 revision 을 사용함