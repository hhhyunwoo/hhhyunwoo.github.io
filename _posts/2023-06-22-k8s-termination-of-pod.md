---
layout: post
title: "[K8S] Termination of Pods"
date: 2023-06-22
categories:
  - Kubernetes
tags: [
    kubernetes,
    k8s,
    pod,
    lifecycle,
  ]
---

```bash
Pod Creation
  |
  v
Pod Scheduling
  |
  v
Pod Initialization
  |  --> Init Containers Start
  |  |       |
  |  |       v
  |  |   Init Containers Running
  |  |       |
  |  |       v
  |  |   Init Containers Terminated
  |  |
  |  v
Pod Running
  |  --> Containers Start
  |  |       |
  |  |       v
  |  |   Containers Running
  |  |       |
  |  |       v
  |  |   Containers Terminated
  |  |
  v
Pod Termination
  |
  v
Pod Garbage Collection
```

쿠버네티스에서는 **파드**가 프로세스 대표하기 때문에, 더 이상 파드가 필요하지 않을 때 어떻게 **Graceful** 하게 프로세스들을 중단하는지 아는 것은 매우 중요하다. *(물론, 갑작스럽게 강제로 `KILL` 하는 경우는 클린업 하는 기회도 없겠지만…)*
<br>

쿠버네티스의 파드 종료 설계는 삭제를 요청하고 언제 프로세스가 종료되는지를 알 수 있게 해줄 뿐만 아니라, 결국 삭제가 완료되는 것을 보장한다. 

**파드 삭제**를 요청했을 때, 클러스터는 파드가 강제로 종료되는 것이 가능하기 전까지 삭제 요청을 기록하고 의도된 **Grace Period** 를 추적한다. 강제 종료 요청이 확인되면, Kubelet은 graceful shutdown 을 시도한다.
<br>

전형적으로 **컨테이너 런타임**은 `TERM` 시그널을 각 **컨테이너의 메인 프로세스**에 보낸다. 많은 컨테이너 런타임들은 컨테이너 이미지에 정의된 `TERM` 값을 대신하여  `STOPSIGNAL` 값을 보내기도 한다. 일단 **Grace Period** 가 만료되면, `KILL` 시그널은 남아있는 프로세스에게 보내지고, 파드는 `API Server` 로부터 삭제된다. 만약 프로세스가 종료되기를 기다리면서 **Kubelet**이나 컨테이너 런타임의 운영 서비스가 재시작된다면, 클러스터는 grace period 첨부터 삭제를 다시 시도할 것 이다.
<br>

한번 흐름을 살펴보자. 

1. 내가 만약 `kubectl` 툴을 사용해서 grace period 는 30초로 설정하고 수동으로 특정 파드를 삭제했다고 하자. (`kubectl delete pod <pod_name> --grace-period=<seconds>`)
2. API Server 에 있는 파드는 grace period 에 따라서 “**dead**” 로 간주되고 해당 상태값으로 업데이트 된다. 만약 이때 내가 `kubectl describe` 를 사용하여 삭제하고 있는 파드를 조회한다면, 파드는 “**Terminating**” 상태로 보일 것이다. 파드가 실행되고 있는 장비에서는 아래와 같은 순서로 진행될 것 이다.(kubelet이 terminating 상태로 마크된 파드를 확인하는대로 kubelet은 local pod shutdown 프로세스를 실행할 것이다.)
    1. 만약 파드의 컨테이너 중 하나에 `preStop` 훅이 걸려있다면, kubelet 은 컨테이너 내부에서 해당 훅을 실행할 것이다. 만약 `preStop` 훅이 grace period 가 만료되고도 실행되고 있다면, kubelet은 2초의 일회성 grace period 를 한번 더 요청한다. 
        
        > **PreStop Hook** : API 요청이나 관리 이벤트(liveness / startup probe failure, preemption, resource contention 등.. ) 에 의해서 컨테이너가 종료될 때 그 즉시 호출 됨.
        > 
    2. kubelet은 컨테이너 런타임을 트리거하여서 각 컨테이너 내부의 프로세스 1에 `TERM` 시그널을 보내도록 한다. *(Process 1은 PID 1을 의미하는 것 같다. 모든 프로세스는 init 프로세스를 부모 프로세스를 가지고 있다. 즉, PID 1은 Init Process 를 의미하기 때문에 해당 프로세스가 죽으면 모든 프로세스가 죽음)*
3. Kubelet이 파드를 graceful하게 셧다운하려고 하는 동시에, 컨트롤 플레인은 해당 파드를 EndpointSlice 객체에서 삭제할지 말지 평가한다. **여기서 해당 객체라는 것은 Selector 가 구성된 Service를 의미**한다. *(즉, 해당 Pod를 select 하여 사용하고 있는 service 가 있는지를 확인한다는 의미).* ReplicaSets 이나 다른 워크로드 리소스들은 더이상 죽고있는 파드를 유효하다고 보지 않는다. 
<br>

1. Grace Period 가 만료되면, **Kubelet**은 강제 종료를 트리거 한다. 컨테이너 런타임은 `SIGKILL` 시그널을 파드 내에 여전히 돌고 있는 프로세스들에게 뿌린다. 또한 **Kubelet** 은 숨겨져 있는 `pause` 컨테이너를 클린업 한다. 
2. **Kubelet** 은 해당 파드를 **Terminal** 상태로 바꾸어준다. (컨테이너의 마지막 상태에 따라서 `Failed` 혹은 `Succeded` 로 바꾸어준다. ) 이 스텝은 1.27 버전 이후부터 보증됨.
3. Kubelet은 **Grace Period를 0으로 설정**하면서 API Server 로부터 파드 객체의 강제 삭제를 트리거한다. 
4. API Server 는 파드의 API 객체를 전부 삭제하고 더 이상 어떤 Client에서도 보이지 않게 한다. 

## Forced Pod Termination

기본적으로 모든 삭제는 **30초**로 Graceful Period 가 설정되어있다. `kubectl delete` 커맨드는 `—grace-period=<seconds>` 옵션을 제공해서 원하는 대로 설정할 수 있게 한다. 0으로 설정하면 강제 종료를 할 수 있다. 

강제 종료가 실행되면, API 서버는 kubelet 이 해당 파드가 노드에서 종료되었다는 것을 확인하는 것을 기다리지 않고 바로 삭제해버린다.

## Garbage collection of Pods

실패한 파드들에 대한 API 객체들은 사람이나 controller 가 직접 삭제해주지 않으면 클러스터의 API에 남아있다. 

컨트롤플레인에 위치한 PodGC(Pod garbage collector) 는 종료된 파드들을 삭제해준다(`Succeded` or `Failed`). 이는 파드의 생성과 삭제로 인한 메모리 릭을 방지해줌. 

ref. [Docs](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)