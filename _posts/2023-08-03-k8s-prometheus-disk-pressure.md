---
layout: post
title: "[K8S] Prometheus 의 Disk Pressure 현상"
date: 2023-08-03
categories:
  - Kubernetes
tags: [
    kubernetes,
    k8s,
    nginx,
    ingress,
  ]
---
# [K8S] Prometheus 의 Disk Pressure 현상

## Description

- `Kuberntes` 환경에서 모니터링을 위해서 `Prometheus`를 사용 중.
- Prometheus는 [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack) 에서 확인할 수 있듯이 `Statefulset`을 사용하고 있음
    - Prometheus 는 수집하고 있는 메트릭을 보존할 필요가 있고, Stable 한 네트워크를 가지고 있어야 하며, 저장소가 Persistent 해야하기 때문에 Statefulset 을 사용하고 있음
- **어느날 아래와 같이 Prometheus 가 떠 있는 노드에서 Disk Pressure 현상이 발생함**

```yaml
Lease:
  HolderIdentity:  kiml-test-monitor1
  AcquireTime:     <unset>
  RenewTime:       Thu, 13 Apr 2023 14:50:18 +0900
Conditions:
  Type                 Status  LastHeartbeatTime                 LastTransitionTime                Reason                       Message
  ----                 ------  -----------------                 ------------------                ------                       -------
  NetworkUnavailable   False   Sun, 09 Apr 2023 11:23:34 +0900   Sun, 09 Apr 2023 11:23:34 +0900   FlannelIsUp                  Flannel is running on this node
  MemoryPressure       False   Thu, 13 Apr 2023 14:50:21 +0900   Thu, 06 Apr 2023 14:59:34 +0900   KubeletHasSufficientMemory   kubelet has sufficient memory available
  DiskPressure         True    Thu, 13 Apr 2023 14:50:21 +0900   Thu, 13 Apr 2023 06:08:51 +0900   KubeletHasDiskPressure       kubelet has disk pressure
  PIDPressure          False   Thu, 13 Apr 2023 14:50:21 +0900   Thu, 06 Apr 2023 14:59:34 +0900   KubeletHasSufficientPID      kubelet has sufficient PID available
  Ready                True    Thu, 13 Apr 2023 14:50:21 +0900   Sat, 08 Apr 2023 01:09:51 +0900   KubeletReady                 kubelet is posting ready status. AppArmor enabled
 
----------
 
 
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
  Resource           Requests   Limits
  --------           --------   ------
  cpu                250m (3%)  0 (0%)
  memory             0 (0%)     0 (0%)
  ephemeral-storage  0 (0%)     0 (0%)
  hugepages-1Gi      0 (0%)     0 (0%)
  hugepages-2Mi      0 (0%)     0 (0%)
Events:
  Type     Reason                Age                       From     Message
  ----     ------                ----                      ----     -------
  Warning  FreeDiskSpaceFailed   15m (x397 over 45h)       kubelet  (combined from similar events): failed to garbage collect required amount of images. Wanted to free 2643082444 bytes, but freed 0 bytes
  Warning  EvictionThresholdMet  5m23s (x8450 over 2d20h)  kubelet  Attempting to reclaim ephemeral-storage
```

## Cause

- Prometheus Pod의 anti-affinity 설정이 되어있지 않아 2개의 Pod 모두 monitor1 노드에 스케줄 됨.
- monitor1의 OOM 발생
- 또는 Disk Pressure 현상이 발생
    - Prometheus 리소스가 사용하는 local-path-retain PV 의 볼륨이 과하게 디스크를 차지
    - monitor2 노드의 syslog 확인
        
        <img width="2465" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/a6f64616-ee7f-4677-b9a3-07e77c3f47ba">
        
        - `Disk usage on iage filesystem is over the high threshold, trying to fress bytes down to the low threshold`
- 2개의 Pod 모두 문제가 생기게 되므로 모니터링 기능이 동작하지 않음.

## Solution

### prometheus 파드 spread out

- Anti-affinity 추가를 통해 같은 Node에 뜨지 않도록 조치

```bash
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - prometheus
        topologyKey: "kubernetes.io/hostname"
```

### Disk Pressure 해결을 위한 Kubelet 재시작

파드를 다른 노드로 옮겨주고 해당 노드의 사용하지 않는 PVC directory 를 삭제하였지만 계속 해당 현상 발생하여 `Kubelet` 을 재시작

```bash
# kubelet 재시작
sudo systemctl restart kubelet.service
```

- Github issue : [node get DiskPressure when disk space is still plenty #66961](https://github.com/kubernetes/kubernetes/issues/66961)
- 위의 깃헙 이슈에서 볼 수 있듯이 kubelet 과 caadvisor 의 버그로 보임.
- kubelet 재시작으로 해결