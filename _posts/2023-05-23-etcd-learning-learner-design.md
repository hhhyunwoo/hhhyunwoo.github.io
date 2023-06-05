---
layout: post
title: "[etcd] [Docs Learning] Learner Design"
date: 2023-05-23
categories:
  - etcd
  - docs
tags: [
    etcd,
    docs,
    learning,
    learner design,
    client,
    grpc,
    http,
  ]
---

> [etcd 공식 Docs](https://etcd.io/docs/v3.5/learning/) 의 Learning 문서를 보고 공부 및 해석한 내용을 기록합니다.
> 

[Docs](https://etcd.io/docs/v3.5/learning/design-learner/)

> ***“Mitigating common challenges with membership reconfiguration”***
> 

[etcd Learner](https://etcd.io/docs/v3.3/learning/learner/)

# **Background (Common Challenges)**

## **1. New Cluster member overloads leader**

<img width="887" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/ae96d588-8f8f-437e-9434-650bd82f1416">

- **`새롭게 etcd 멤버`**가 데이터가 없는 상태로 join 하게 되면, 리더들의 로그를 catch 하도록 리더한테 많은 양의 업데이트를 요구함
    - → `leader overloaded`

## **2. Network Partitions scenarios**

<img width="913" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/474060c4-b359-4489-9881-3c1f827ad7b4">

- `네트워크 파티션`이 발생했을 때, 리더가 만약 **`active quorum`** 상태에 유지된다면 클러스터는 계속 작동할 것임

### **2.1 Leader isolation**

<img width="826" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/5949f77c-28a4-4d50-8e6c-ea2efb1982e0">

- 리더와 같은 파티션에 리더의  active follower 가 없는 상태. (Lost quorum)
- 리더는 follower 로 돌아가고, 이 상황은 클러스터의 가용성에 영향을 미침
- Leader Election 이 발생하면서 새로운 리더를 선출하게 됨

### **2.2 Cluster Split 3+1**

<img width="885" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/6a17b49d-14ac-46f8-a46b-78bbc2725983">

- 새로운 노드가 3개의 노드가 있는 클러스터로 조인되었을 때, 쿼럼은 3으로 증가함 (`2(3/2+1)`)
- 그리고 네트워크 파티션이 발생했을 경우 만약 새로운 노드가 리더와 같은 파티션에 존재한다면, 리더는 여전히 active quorum 을 가지고 있음.
- 따라서 클러스터는 계속 작동할 것임.
- `새로운 멤버가 "리더 파티션"에 속함` ⇒ `리더가 쿼럼을 유지함` ⇒ `클러스터 이용가능`

### **2.3 Cluster Split 2+2**

<img width="921" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/5269477b-4f51-427a-8872-ec36894eb529">

- 2(`follower, leader`) + 2(`follower, new follower`)
- 위와 같은 상황에서는 리더는 2개의 active follower 를 가짐. 즉, 쿼럼의 값이 3인데 이를 채우지 못함.
- 따라서 리더는 다시 follower로 돌아갈 것이고, 리더 재선출이 발생함

### **2.4 Quorom Lost**

<img width="889" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/945bbe47-c632-42e7-8aa5-b0ac46829d63">

- 네트워크 파티션이 발생하고나서 새로운 멤버가 추가되는 경우
- 새로운 노드가 시작하기 전에는 클러스터는 오직 2개의 active node를 가지고 있는데, 이는 쿼럼을 만족하지 못함. 즉, 새로운 노드가 추가되면서 전체 클러스터의 쿼럼은 증가하지만, 아직 새로운 노드가 시작을 못했기 때문에 active 하지 않음.
- → `리더 재선출을 트리거`

> *Since member add operation can change the size of quorum, it is always recommended to “member remove” first to replace an unhealthy node.*
> 

## **3. Cluster Misconfigurations *(worse case)***

<img width="953" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/90d31127-623c-485d-bff3-d0f0b75e9a21">

- Membership reconfiguration
    - 1. etcdctl member add
    - 2. Starting an etcd server process with the given peer URL
    - > If the URL that given to etcdctl was invalid, it will fail
- member add 하면 쿼럼에는 바로 적용되어서 클러스터에서는 바뀐 쿼럼 값을 가지고 계속 판단하는데, Misconf 인 노드가 들어오면 active 는 안되고 쿼럼에는 포함되니깐 cluster가 unavailable 상태가 될 수 밖에 없음
    - → simple misconfiguration can fail the whole cluster into an inoperative state

Can we make membership reconfiguration less disruptive ***by not changing the size of quorum***?

Can a new node be **idle**, only **requesting the minimum updates from leader**, until it catches up?

Can membership misconfiguration be always **reversible** and handled in a more **secure** way (wrong member add command run should never fail the cluster)?

Should an user worry about **network topology when adding a new member**?

Can member add API work regardless of the location of nodes and ongoing network partitions?

# **Raft Learner**

`**Raft Learner will solve those issue**`

- Raft 4.2.1 에서는 `Learner` 라는 노드의 새로운 상태를 소개함.
- 클러스터에 새로운 노드가 추가되었을 때 리더들의 로그를 catches up 하기 전까지 `non-voting member` 상태로 만들어줌
- “member add –learner” -> Wait until lerner node catches up to leader’s logs.
    - Until then, learner node neither votes nor counts towards quorum.
- **member promote API**
    - Once learner node has caught up to leader’s log, “member promote” API can promote it to a normal voting node that counts towards quorum (`승진!!!`)
    - etcd v3.4 learner **can be promoted only when it satisfies the safety requirement**.
        - How does it check the requirement?
            - ***func canPromote(idx int) bool***
- etcd limits the total number of learners that a cluster can have.
    - To avoid overloading the leader with log replication

<img width="900" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/80f89b69-102c-4ed8-b28a-fffea91d2af9">

- When a learner has caught up with leader’s progress, the learner can be promoted to a voting member using `member promote` API, which then counts towards the quorum (see *Figure 11*).

<img width="876" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/b845888d-5bbd-48e9-a56b-324650a8f1ad">

- etcd server validates promote request to ensure its operational safety. Only after its log has caught up to leader’s can learner be promoted to a voting member (see *Figure 12*).

<img width="916" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/d56c342e-5a8d-448c-9bea-4d45b0d59641">

- Learner only serves as a standby node until promoted: Leadership cannot be transferred to learner. Learner rejects client reads and writes (client balancer should not route requests to learner).

<img width="899" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/d5cbcd72-b451-436d-baf5-df190b241b04">

# **Future work**

- Make learner to default state
- Make voting-member promotion fully automatic
- Make learner standby failover node
- Make learner read-only