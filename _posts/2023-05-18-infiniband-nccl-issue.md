---
layout: post
title: "[Infiniband] NCCL WARN Call to ibv_reg_mr failed 이슈 해결"
date: 2023-05-18
categories:
  - Trouble Shooting
  - Infiniband
  - Kubernetes
tags: [
    infiniband,
    kubernetes,
    k8s,
    kernel,
    linux,
    docker,
  ]
---

## 개요

Infiniband 네트워크를 사용하는 클러스터에서 Multi Node 분산 학습을 실행할 때 `NCCL WARN Call to ibv_reg_mr failed` 에러가 발생하는 경우가 있음. 

아래와 같이 에러가 발생하면서 학습이 중단되는 케이스가 있다. 

```bash
ibvwrap.c: 106 NCCL WARN Call to ibv_reg_mr failed
NCCL INFO ib_plugin.c:448 -> 2
NCCL INFO include/net.h:23 -> 2
NCCL INFO transport/net.cc:248 -> 2
```

## 원인 파악

NCCL 을 사용할 때 충분한 MEMLOCK 을 필요로 하기 때문에, memory lock limit 을 설정해줘야함. 

[공식 Nvidia Docs](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting.html) 에서도 해당 이슈에 대한 Trouble Shooting 을 이야기해주는데, 장비의 `Memory Lock` 을 풀어줘야한다는 것이 제안하는 방법

### Memory Lock 이란?

- 메모리에 `Lock` 해둘 수 있는 최대 크기를 의미함.
- 메모리 Lock 은 메모리가 항상 RAM에 있고 스왑 디스크로 이동하지 않도록 하는 역할

ref. [https://stackoverflow.com/questions/9818755/why-would-we-need-to-lock-a-processs-address-space-in-ram](https://stackoverflow.com/questions/9818755/why-would-we-need-to-lock-a-processs-address-space-in-ram)

### Memory Lock Size 를 변경하는 법

- **Linux Setting**
    - `ulimit` 명령어로 확인이 가능함
        
        ```bash
        $ ulimit -a
        core file size          (blocks, -c) 0
        data seg size           (kbytes, -d) unlimited
        scheduling priority             (-e) 0
        file size               (blocks, -f) unlimited
        pending signals                 (-i) 8207353
        max locked memory       (kbytes, -l) unlimited
        max memory size         (kbytes, -m) unlimited
        open files                      (-n) 65536
        pipe size            (512 bytes, -p) 8
        POSIX message queues     (bytes, -q) 819200
        real-time priority              (-r) 0
        stack size              (kbytes, -s) 8192
        cpu time               (seconds, -t) unlimited
        max user processes              (-u) 65536
        virtual memory          (kbytes, -v) unlimited
        file locks                      (-x) unlimited
        ```
        
    - 위의 결과값과 같이 linux setting 자체에서 max memory size 를 설정할 수 있다.
    - 만약 다른 값을 원한다면 `/etc/security/limits.conf` 파일에서 수정을 진행하면 되겠다.
- **Docker Setting**
    - System daemon 으로 `docker.daemon` 을 실행한다는 가정하에, `systemctl` 명령어로 해당 설정값 확인이 가능하다.
    
    ```bash
    $ sudo systemctl show docker | grep Limit
    ...
    LimitMEMLOCK=65536
    LimitMEMLOCKSoft=65536
    ...
    ```
    
    - 그럼 Container 에서 ulimit 을 확인하면 어떤 값을 **overwrite** 할까?
        
        ```bash
        root@container# ulimit -a | grep lock
        max locked memory       (kbytes, -l) 64
        ```
        
        - 해당 Linux setting 에 위의 Docker config를 가지고 Container 를 만들었을 때 docker config 를 사용하는 것으로 볼 수 있다.
    - Docker setting 을 변경하려면 `/etc/sysconfig/docker` 파일을 수정하면 되겠다.
- **Kubernetes**
    - 구글링을 해본 결과 아직 Kubernetes 상에서는 해당 값을 설정하는 방법은 없어보인다..
    - 해당 [Kubernetes Issue](https://github.com/kubernetes/kubernetes/issues/3595) 를 확인해보면 개발이 되는 것으로 보인다.

## 해결책

- 위의 3가지 옵션 중 하나를 선택할 수 있다. 하지만 우리 환경은 `Kubernets Cluster` 기반에서 돌아가고 있기 때문에, ***전체적인 Memory Lock Limit 으로 설정하는 것은 매우 위험하다고 판단***.
- 그렇기 때문에 다른 방법을 찾아보았다.

### IPC_LOCK 권한 설정

- `IPC_LOCK` 권한이란?
    - 컨테이너가 호스트 시스템의 공유 메모리 세그먼트에 대한 잠금을 설정할 수 있는 권한을 나타냄.
    - 이 권한은 컨테이너가 특정 **IPC 리소스에 액세스하고 조작할 수 있는지를 제어**
- 학습이 도는 컨테이너에 IPC_LOCK 권한을 부여하게 되면 ulimit을 무시하고 최대의 메모리를 사용할수 있다!

```yaml
# CONTAINER
securityContext:
    allowPrivilegeEscalation: false
    capabilities:
      add:
      - IPC_LOCK
      drop:
      - all
    privileged: false

# POD
securityContext:
            fsGroup: 1000
            runAsGroup: 1000
            runAsNonRoot: true
            runAsUser: 1000
```
- 위의 부분들인데, 영향을 주는 부분은 아래의 pod 권한과 drop {"all"} 부분임. 다른 것들은 각각 추가해서 테스트해봤는데 정상동작함
- 따라서 IB 인경우 위의 두개를 빼는 로직을 hotfix 로 추가

따라서 우리는 해당 이슈를 해결하기 위해서 노드 혹은 도커의 Memory limit 을 설정하기 보다, 학습이 도는 컨테이너에 `IPC_LOCK` 권한을 부여하면서 해결하였음.