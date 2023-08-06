---
layout: post
title: "[K8S] V100 GPU 장비 메모리 Hang 발생 Trouble shooting"
date: 2023-04-03
categories:
  - Kubernetes
tags: [
    kubernetes,
    k8s,
    gpu,
    memory,
  ]
---
## Description

- GPU 장비로 Kubernetes 클러스터를 관리하다가 어느 순간부터 여러개의 GPU 장비에서 Memory Hang 현상이 발생

<img width="1129" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/35528d3b-683b-4147-84df-f41c4a3d12ea">


## Cause

- 해당 메모리 행이 발생하는 장비의 메모리 값을 분석
    - kodac_tb_memory_total : 512 GB
    - kodac_memorysize : 527787256 KiB
        - (527787256 kb = 503GiB)
    
    ```bash
    root@test-test-100v12:/# cat /proc/meminfo
    MemTotal:       527787256 kB
    MemFree:        370712636 kB
    MemAvailable:   380421124 kB
    Buffers:          136604 kB
    Cached:         45594528 kB
    SwapCached:            0 kB
    Active:         110750512 kB
    Inactive:       40200512 kB
    Active(anon):   104539864 kB
    Inactive(anon): 34361512 kB
    Active(file):    6210648 kB
    Inactive(file):  5839000 kB
    Unevictable:           0 kB
    Mlocked:               0 kB
    SwapTotal:             0 kB
    SwapFree:              0 kB
    Dirty:               284 kB
    Writeback:             0 kB
    AnonPages:      105219780 kB
    Mapped:         35780904 kB
    Shmem:          34363400 kB
    KReclaimable:     922780 kB
    Slab:            3007904 kB
    SReclaimable:     922780 kB
    SUnreclaim:      2085124 kB
    KernelStack:       30976 kB
    PageTables:       951676 kB
    NFS_Unstable:          0 kB
    Bounce:                0 kB
    WritebackTmp:          0 kB
    CommitLimit:    263893628 kB
    Committed_AS:   469875780 kB
    VmallocTotal:   34359738367 kB
    VmallocUsed:      359952 kB
    VmallocChunk:          0 kB
    Percpu:           226304 kB
    HardwareCorrupted:     0 kB
    AnonHugePages:         0 kB
    ShmemHugePages:        0 kB
    ShmemPmdMapped:        0 kB
    FileHugePages:         0 kB
    FilePmdMapped:         0 kB
    CmaTotal:              0 kB
    CmaFree:               0 kB
    HugePages_Total:       0
    HugePages_Free:        0
    HugePages_Rsvd:        0
    HugePages_Surp:        0
    Hugepagesize:       2048 kB
    Hugetlb:               0 kB
    DirectMap4k:    11855420 kB
    DirectMap2M:    460660736 kB
    DirectMap1G:    66060288 kB
    ```
    

<img width="1131" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/9896c366-9496-4d72-8c92-558f0032a985">

- 실질적으로 해당 GPU Node 가 사용되는 부분은 해당 장비를 기반으로 만들어진 Kubernetes 클러스터 위에 직접 구축한 MLOps 플랫폼 위에서 VM 형태의 Job 이 돌고 있음
- 해당 Job 에 할당된 리소스는 `48 core, 4gpu, 500Gi mem, 32GB GPUmem`
    - 가장 큰 리소스 타입

### 현재 장비에 떠 있는 프로세스들의 리소스 사용량 확인

```bash
Non-terminated Pods:                       (11 in total)
  Namespace                                Name                                                       CPU Requests  CPU Limits  Memory Requests  Memory Limits  Age
  ---------                                ----                                                       ------------  ----------  ---------------  -------------  ---
  fluentd-log-monitor                      fluentd-ds-qzvzg                                           500m (0%)     500m (0%)   1000Mi (0%)      1000Mi (0%)    13d
  gpu-monitoring                           gpu-monitoring-dcgm-exporter-srdnc                         0 (0%)        0 (0%)      0 (0%)           0 (0%)         19d
  kube-system                              kube-flannel-phlw5                                         150m (0%)     300m (0%)   64M (0%)         500M (0%)      322d
  kube-system                              kube-proxy-hwxsj                                           0 (0%)        0 (0%)      0 (0%)           0 (0%)         322d
  kube-system                              node-shell-b28804c0-f71d-47aa-b5cb-9754e80f01e2            0 (0%)        0 (0%)      0 (0%)           0 (0%)         12m
  managed-dynamic-pv                       managed-dynamic-pv-dvq8r                                   0 (0%)        0 (0%)      0 (0%)           0 (0%)         322d
  managed-monitoring-stack                 managed-monitoring-stack-prometheus-node-exporter-xjz24    0 (0%)        0 (0%)      0 (0%)           0 (0%)         322d
  node-feature-discovery                   nfd-worker-qlt72                                           0 (0%)        0 (0%)      0 (0%)           0 (0%)         322d
  nvidiadeviceplugin                       nvidiadeviceplugin-nvidia-device-plugin-tbk8r              0 (0%)        0 (0%)      0 (0%)           0 (0%)         322d
  nvidiafeaturediscovery                   nvidiafeaturediscovery-gpu-feature-discovery-h87pm         0 (0%)        0 (0%)      0 (0%)           0 (0%)         322d
  ws-????-???                              job-run-?????-worker-5                                     48 (85%)      48 (85%)    500Gi (99%)      500Gi (99%)    4h15m
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
  Resource           Requests           Limits
  --------           --------           ------
  cpu                48650m (87%)       48800m (87%)
  memory             525374500Ki (99%)  538419488000 (99%)
  ephemeral-storage  0 (0%)             0 (0%)
  hugepages-1Gi      0 (0%)             0 (0%)
  hugepages-2Mi      0 (0%)             0 (0%)
  nvidia.com/gpu     4                  4
```

- 현재 V100 장비의 전체 가용 메모리는 `527787256` KB 인데, 사용중인 해당 Job의 요구 메모리는 500 GiB 이다.
    - GB와 GiB 는 단위 차이가 있음.
    - `500 GiB`는 500 * 1024 * 1024 = **524288000 KB**
- 즉, 노드 전체 memory 의 `527787256` 에서 job 의 `524288000` 를 제외하면 **3499256 (약 3GiB)** 가 남음

### GB vs GiB

- Gigabyte 와 Gibibyte 를 의미
- 십진법 및 이진법의 개념차이 임

<img width="1122" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/334dfc27-7c73-4709-9539-ba5031b6cbeb">

### Job이 없는 기본 프로세스들의 사용량 확인

```bash
root@test-test-100v1:/# free
              total        used        free      shared  buff/cache   available
Mem:      527787256     4844120     5621468       61880   517321668   520292100
Swap:             0           0           0
root@test-test-100v1:/#
```

- 따로 job 리소스가 떠있지 않는데도 아래를 보면 사용 가능한 메모리 양은 `520292100` 뿐이다.
- 해당 값은 `500Gi` 보다 적기 때문에 만약 `500Gi` 를 할당받은 **Job이 메모리를 다 써버린다면** 노드 **OOM**은 충분히 일어날 수 있음!

## Solution

- 리소스를 할당할 때 GiB가 아닌, GB로 할당하도록 수정하여, 확인하게 쉽게 설정을 바꾸었다.