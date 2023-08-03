---
layout: post
title: "[K8S] 5.4.0-132 커널의 epoll 버그로 인한 etcd leader election 이슈"
date: 2023-05-17
categories:
  - Kubernetes
tags: [
    kubernetes,
    k8s,
    etcd,
    kernel,
    linux,
    leader_election
  ]
---
# [k8s] 5.4.0-132 커널의 epoll 버그로 인한 etcd leader election 이슈

- 사용 중인 클러스터의 Control plane 은 Master[1:3] 노드로 구성되어있고 HA 구성이 되어있는 상태.
    - Kubernetes 는 Control plane 노드에서 `etcd` 라는 Database 를 Kubernetes 리소스 메타데이터 저장소로 사용하고 있음. 매우 중요한 컴포넌트

<img width="915" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/99b778fd-108f-4be3-b586-9b270ece8050">


ref. [https://kubernetes.io/ko/docs/concepts/overview/components/](https://kubernetes.io/ko/docs/concepts/overview/components/)

## 이슈 개요

- 운영중인 클러스터에서 `The API Server is burning too much error budget` 이라는 에러가 발생하는 것을 알람으로 받게되었다.
- 그 후 클러스터에서 `EtcdNoLeader` 에러가 master2번과 master3번 노드에서 추가적으로 발생
- 5분 뒤 응답속도 정상으로 돌아오면서 클러스터 정상화 됨
    - `kube-apiserver` 접근이 지연되면서 `kubectl` 사용 시 `"Error from server: etcdserver: leader changed"` 에러 발생
- 해당 이슈가 2-30분 간격으로 계속 발생

---

## 이슈 분석

### 노드의 컨테이너에 접근하여 etcdNoLeader 발생 확인

```bash
# Master 1번 노드의 etcd container에서 확인
# Master 2번 노드가 정상적이지 않은 것  확인
master1:~$ sudo docker exec -it 2001sdedaw170 /bin/sh
# etcdctl endpoint health
{"level":"warn","ts":"2023-01-11T11:30:25.332Z","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"endpoint://client-4e9097d1-8f27-4dec-befe-932345b3a82c/x.x.x.x:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
https://x.x.x.x:2379 is healthy: successfully committed proposal: took = 11.634432ms
https://x.x.x.x:2379 is healthy: successfully committed proposal: took = 11.725419ms
https://x.x.x.x:2379 is unhealthy: failed to commit proposal: context deadline exceeded
Error: unhealthy cluster

# Master 2번 노드의 etcd container에서 확인
master2:~$ sudo docker exec -it 2001287ffb70 /bin/sh
# etcdctl endpoint health
{"level":"warn","ts":"2023-01-11T11:37:22.498Z","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"endpoint://client-641ebecc-a28e-498a-bdc3-574d44b9f73f/127.0.0.1:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
https://127.0.0.1:2379 is unhealthy: failed to commit proposal: context deadline exceeded
Error: unhealthy cluster
```

### master[1:3] 노드의 etcd docker container 의 로그를 분석함

```bash
# master 1
# etcdctl member list -w table
{"level":"warn","ts":"2023-01-06T09:02:23.846Z","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"endpoint://client-d0ef2028-d62b-4751-9a78-bc8505a540cc/127.0.0.1:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
Error: context deadline exceeded
# etcdctl endpoint health
{"level":"warn","ts":"2023-01-06T09:02:55.298Z","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"endpoint://client-114c51ac-a69e-46aa-a718-42ae334175c9/127.0.0.1:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
https://127.0.0.1:2379 is unhealthy: failed to commit proposal: context deadline exceeded
Error: unhealthy cluster

# master 2
master2:~$ sudo docker ps | grep etcd
a57237cfc676   quay.io/coreos/etcd:v3.4.13   "/usr/local/bin/etcd"    4 weeks ago         Up 4 weeks                   etcd2
master2:~$ sudo docker exec -it a57237cfc676 /bin/sh
# etcdctl member list -w table
+------------------+---------+-------+---------------------------+---------------------------+------------+
|        ID        | STATUS  | NAME  |        PEER ADDRS         |       CLIENT ADDRS        | IS LEARNER |
+------------------+---------+-------+---------------------------+---------------------------+------------+
| b9f835148c70c3bb | started | etcd2 |  https://x.x.x.x:2380 |  https://x.x.x.x:2379 |      false |
| dd20b5740a7a8bfc | started | etcd3 | https://x.x.x.x:2380 | https://x.x.x.x:2379 |      false |
| e2b224392171a306 | started | etcd1 |  https://x.x.x.x:2380 |  https://x.x.x.x:2379 |      false |
+------------------+---------+-------+---------------------------+---------------------------+------------+
# etcdctl member list | cut -d, -f5 | sed -e 's/ //g' | paste -sd ','
https://x.x.x.x:2379,https://x.x.x.x:2379,https://x.x.x.x:2379
# ETCDCTL_ENDPOINTS="https://x.x.x.x:2379,https://x.x.x.x:2379,https://x.x.x.x:2379"
# etcdctl endpoint health
{"level":"warn","ts":"2023-01-06T08:33:21.501Z","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"endpoint://client-9db42de3-861f-4224-a712-ec2dbac5c6be/x.x.x.x:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
{"level":"warn","ts":"2023-01-06T08:33:21.501Z","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"endpoint://client-a7d064dd-31bd-4ba6-86f6-23f1e220bb17/x.x.x.x:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
{"level":"warn","ts":"2023-01-06T08:33:21.501Z","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"endpoint://client-80ca7865-535b-4b18-bdac-61641a98eccb/x.x.x.x:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
https://x.x.x.x:2379 is unhealthy: failed to commit proposal: context deadline exceeded
https://x.x.x.x:2379 is unhealthy: failed to commit proposal: context deadline exceeded
https://x.x.x.x:2379 is unhealthy: failed to commit proposal: context deadline exceeded
Error: unhealthy cluster
```

---

- Master1 에서는 etcdctl 명령어 자체가 안먹힘
    - "[https://127.0.0.1:2379](https://127.0.0.1:2379/) is unhealthy: failed to commit proposal: context deadline exceeded " 이런 에러 발생
- ETCD Server Log
    - 1번에서 2,3번으로 연결이 안되는 것으로 보임

```bash
# Master 1
2023-01-06 06:37:05.978890 W | rafthttp: health check for peer 19437e9fbebfe6e7 could not connect: read tcp x.x.x.x:56582->x.x.x.x:2380: i/o timeout
2023-01-06 06:37:05.978918 W | rafthttp: health check for peer 90169b554bad10c6 could not connect: read tcp x.x.x.x:35330->x.x.x.x:2380: i/o timeout
2023-01-06 06:37:05.978934 W | rafthttp: health check for peer 90169b554bad10c6 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:37:05.978952 W | rafthttp: the clock difference against peer 90169b554bad10c6 is too high [1m29.239296422s > 1s]
2023-01-06 06:37:05.978965 W | rafthttp: health check for peer 19437e9fbebfe6e7 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:37:05.978973 W | rafthttp: the clock difference against peer 19437e9fbebfe6e7 is too high [1m29.243035275s > 1s]
raft2023/01/06 06:32:33 INFO: 909af5b6b434f7a9 is starting a new election at term 946
raft2023/01/06 06:32:33 INFO: 909af5b6b434f7a9 became candidate at term 947
raft2023/01/06 06:32:33 INFO: 909af5b6b434f7a9 received MsgVoteResp from 909af5b6b434f7a9 at term 947
raft2023/01/06 06:32:33 INFO: 909af5b6b434f7a9 [logterm: 10, index: 10744605] sent MsgVote request to 19437e9fbebfe6e7 at term 947
raft2023/01/06 06:32:33 INFO: 909af5b6b434f7a9 [logterm: 10, index: 10744605] sent MsgVote request to 90169b554bad10c6 at term 947
2023-01-06 06:32:35.971784 W | rafthttp: health check for peer 19437e9fbebfe6e7 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:35.971822 W | rafthttp: health check for peer 90169b554bad10c6 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:35.971834 W | rafthttp: health check for peer 19437e9fbebfe6e7 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:35.971847 W | rafthttp: the clock difference against peer 19437e9fbebfe6e7 is too high [1m29.243035275s > 1s]
2023-01-06 06:32:35.971855 W | rafthttp: health check for peer 90169b554bad10c6 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:35.971861 W | rafthttp: the clock difference against peer 90169b554bad10c6 is too high [1m29.239296422s > 1s]
2023-01-06 06:32:40.971920 W | rafthttp: health check for peer 90169b554bad10c6 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:40.971945 W | rafthttp: the clock difference against peer 90169b554bad10c6 is too high [1m29.239296422s > 1s]
2023-01-06 06:32:40.971958 W | rafthttp: health check for peer 90169b554bad10c6 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:40.971964 W | rafthttp: health check for peer 19437e9fbebfe6e7 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:40.971972 W | rafthttp: health check for peer 19437e9fbebfe6e7 could not connect: dial tcp x.x.x.x:2380: i/o timeout
2023-01-06 06:32:40.971978 W | rafthttp: the clock difference against peer 19437e9fbebfe6e7 is too high [1m29.243035275s > 1s]

위의 로그 반복

# Master 2
2023-01-06 06:23:44.592030 I | embed: rejected connection from "x.x.x.x:58832" (error "read tcp x.x.x.x:2380->x.x.x.x:58832: i/o timeout", ServerName "")
2023-01-06 06:23:44.593077 I | embed: rejected connection from "x.x.x.x:58846" (error "read tcp x.x.x.x:2380->x.x.x.x:58846: i/o timeout", ServerName "")
2023-01-06 06:23:44.593210 I | embed: rejected connection from "x.x.x.x:58858" (error "read tcp x.x.x.x:2380->x.x.x.x:58858: i/o timeout", ServerName "")
2023-01-06 06:27:14.244195 W | etcdserver: cannot get the version of member 909af5b6b434f7a9 (Get https://x.x.x.x:2380/version: net/http: TLS handshake timeout)
2023-01-06 06:35:59.199845 W | etcdserver: failed to reach the peerURL(https://x.x.x.x:2380) of member 909af5b6b434f7a9 (Get https://x.x.x.x:2380/version: net/http: TLS handshake timeout)
2023-01-06 06:35:59.199863 W | etcdserver: cannot get the version of member 909af5b6b434f7a9 (Get https://x.x.x.x:2380/version: net/http: TLS handshake timeout)
```

---

- 상황 정리
    - Master1 에서 2,3 번으로의 통신 불가
    - ETCD 연결을 확인해보면 1번은 조회가 되지 않고 2,3번이 Leader 를 번갈아가면서 가져가고 있음
- master1 에서 2,3 으로의 tcp 통신 확인
    - master1에서 Master2,3 의 etcdserver 로 telnet 도 잘 붙음
- CERT 인증 이슈?
    - 간헐적으로 발생하는 것으로 봐서는 인증 이슈는 아닌 것으로 보임

---

### 임시 해결

- master1의 etcdserver container 재시작 진행

```bash
master1:~$ sudo docker ps | grep etcd
e5db1897e6bc   quay.io/coreos/etcd:v3.4.13                  "/usr/local/bin/etcd"    3 weeks ago      Up 3 weeks                etcd1
master1:~$ sudo docker restart e5db1897e6bc
e5db1897e6bc
```

---

- 재시작 했더니 정상적으로 ETCD server 통신이 가능한 것 확인

```bash
# etcdctl endpoint status --write-out table
+---------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|         ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+---------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://x.x.x.x:2379 | 19437e9fbebfe6e7 |  3.4.13 |   24 MB |      true |      false |      1975 |   10809508 |           10809508 |        |
| https://x.x.x.x:2379 | 90169b554bad10c6 |  3.4.13 |   24 MB |     false |      false |      1975 |   10809508 |           10809508 |        |
| https://x.x.x.x:2379 | 909af5b6b434f7a9 |  3.4.13 |   24 MB |     false |      false |      1975 |   10809508 |           10809508 |        |
+---------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
```

---

## 명확안 원인 파악

### 5.4.0-132-generic x86_64 커널 버전에 epoll 버그가 있는 것으로 확인

- ref
    - [https://lore.kernel.org/lkml/20220823080117.738248512@linuxfoundation.org/](https://lore.kernel.org/lkml/20220823080117.738248512@linuxfoundation.org/)
    - [https://bugs.launchpad.net/ubuntu/+source/containerd/+bug/1996678](https://bugs.launchpad.net/ubuntu/+source/containerd/+bug/1996678)
    - [https://forum.cloudron.io/topic/8101/fix-for-kernel-bug-in-ubuntu-20-04-causing-various-issues](https://forum.cloudron.io/topic/8101/fix-for-kernel-bug-in-ubuntu-20-04-causing-various-issues)

### 현재 노드의 커널 버전 확인

```bash
$ kubectl get node -o wide | awk '{print $1, $11}'
NAME
master1 5.4.0-132-generic
master2 5.4.0-132-generic
master3 5.4.0-132-generic
...

# Linux version 5.4.0-132-generic (buildd@lcy02-amd64-059) (gcc version 9.4.0 (Ubuntu 9.4.0-1ubuntu1~20.04.1))
```

### 사내 인프라 공지 확인

- `5.4.0-132 focal release` 중 `epoll: autoremove wakers even more aggressively` 항목이 비슷한 증상을 유발하는 업데이트가 의심된다는 사내 인프라 내용 확인
    - *https://launchpad.net/ubuntu/+source/linux/5.4.0-132.148*
- 해당 `epoll 버그는` runc 에도 영향을 주며 `etcd` 에서 epoll을 사용하기 때문에 접속 에러를 유발하기도 함. 또한 일부 `golang` 프로그램 중 커넥션 에러를 유발한다고 함

## 해결

- 해당 버그는 **5.4.0-135**부터 해결되었음. OS 재설치까지는 필요없고 최신 버전으로 커널 패치를 진행하면 됨. 따라서 해당 버전에 속하는 노드들을 Rolling Update 로 커널 패치 작업 진행해서 해결함!
- 이후로 해당 이슈는 발생하지 않음.