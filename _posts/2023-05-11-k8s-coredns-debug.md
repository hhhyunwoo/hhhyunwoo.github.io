---
layout: post
title: "[K8S] 같은 노드의 CoreDNS 로의 응답이 없는 이슈 (dns resolution failed)"
date: 2023-05-11
categories:
  - Kubernetes
tags: [
    k8s,
    coredns,
    dns,
    nslookup,
    resolv
  ]
---
## Description

- `coreDNS` **pod**와 **다른 pod**가 **같은 노드**에 떠있으면, 간헐적으로 **dns query 응답을 받지 못하는 이슈**

```json
dns resolution failed
```

- tcpdump 확인 결과 coreDNS가 같은 노드의 다른 pod에 대해서 ARP reply를 받지 못함.

### [CoreDNS](https://coredns.io/) 란?

- CoreDNS : [reference](https://kubernetes.io/docs/tasks/administer-cluster/coredns/)
- CoreDNS 는 유연하고 확장가능한 **DNS 서버**이고, **Kubernetes 클러스터의 DNS 서버로 사용할 수 있음**.
- 또한 CNCF 프로젝트임.
- `kubespray`를 사용한다면, kubespray에서 coredns를 설치해줄 수 있다.

## Cause

- ~~구체적인 coreDNS 원인에 대해서는 조금 더 알아볼 필요가 있음~~
    - ~~이런 이슈들을 해결하기 위해서 coredns 에서 추가된 것들이 있다??~~
    - ~~dns lookup 과정이라던가, dns 부하문제라든가 이런것들 완화시키기 위해서 추가된 것들이 있음. 찾아보자~~

## Solution

실질적인 coreDNS의 이슈를 해결할 수는 없어서, 두 가지 방법으로 이슈를 해결하였다. (팀원분께서..)

1. 문제가 발생하고 있는 Worker Node에 coreDNS를 띄우지 않도록 한다.
2. dns-autoscaler 를 수정하여 coreDNS 파드의 수를 줄인다.

위의 작업을 위해서 CoreDNS에 대해서 조금 더 알아 봐야하기 때문에 설정 방법을 정리해보았다.

### Add-On Components 란?

- [Kubernetes Components](https://kubernetes.io/ko/docs/concepts/overview/components/) 에서 참고할 수 있듯이, **Kubernetes**에는 흔히 알고있는 컴포넌트들을 포함하여 `애드온` 이라는 부분도 존재한다.
- 애드온은 쿠버네티스 리소스([데몬셋](https://kubernetes.io/ko/docs/concepts/workloads/controllers/daemonset), [디플로이먼트](https://kubernetes.io/ko/docs/concepts/workloads/controllers/deployment/) 등)를 이용하여 클러스터 기능을 구현함.
- 이들은 클러스터 단위의 기능을 제공하기 때문에 애드온에 대한 네임스페이스 리소스는 `kube-system` 네임스페이스에 속함.
- 네트워킹과 네트워킹 폴리시 역할을 하는 CNI 컴포넌트, 서비스 검색을 위한 CoreDNS, 시각화 제어 등의 추가적인 컴포넌트가 여기 포함됨

```bash
# 아래의 파일들이 Add-On 을 위해서 관리되는 파일들 

test-master1:/etc/kubernetes$ pwd
/etc/kubernetes

test-master1:/etc/kubernetes$ ls | grep dns
coredns-clusterrolebinding.yml
coredns-clusterrole.yml
coredns-config.yml
coredns-deployment.yml
coredns-sa.yml
coredns-svc.yml
dns-autoscaler-clusterrolebinding.yml
dns-autoscaler-clusterrole.yml
dns-autoscaler-sa.yml
dns-autoscaler.yml
```

### Critical Add-On Pods들의 스케줄링을 보장하는 법

- **Kubernetes** 의 코어 컴포넌트인 API-Server, Scheduler 와 Control manager 들은 Control plane 노드에 떠 있다. 하지만 `Add-ons` 들은 일반적인 클러스터 노드에 떠 있는데, 예를 들어 **DNS, UI, Metrics-server** 를 담당하는 Add-On 컴포넌트들이 pending 에 걸리거나, evicted가 되면 클러스터는 정상적으로 동작하지 않는다.
- 따라서 이런 부분들을 해결하기 위해서 해당 컴포넌트들은 Yaml 을 /etc/kubernetes 에 보관하며, priorityClassName 값으로 `system-cluster-critical` or `system-node-critical` 를 추가해서 매우 중요한 컴포넌트라고 Kubernetes 에 알린다. 이를 통해서 수동으로 삭제나 변경이 안됨

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/93c3805c-2f36-440f-abb5-68c28c4dbc00)

### CoreDNS의 설정 방법

- CoreDNS도 개별적으로 떠 있는 컴포넌트가 아니라 Kubernetes 클러스터 관리를 위해 떠 있는 클러스터 애드온 컴포넌트임.
- 따라서 CoreDNS는 단순하게 kubectl을 사용해서 deployment 의 replicas를 변경하거나, node selector를 수정하는 작업이 안됨

### 1) worker node에 core dns 파드가 뜨지 않도록 수정

- coreDNS Deployment 는 위에서 언급한 것 처럼 priorityClassName 값으로 `system-cluster-critical` 가 설정되어 있기 떄문에, kubectl 로 명세 수정이 불가능함.
- 따라서 위험하긴 하지만 /etc/kubenetes/coredns-deployment.yaml 명세를 직접 수정해주는 방법으로 수행.
    - coreDNS가 워커 노드에 스케줄 되지 않도록 설정.
    - /etc/kubernetes/coredns-deployment.yml 파일 직접 수정.
        - 워커 노드를 제외한 나머지 노드에 labels 생성.
        - /etc/kubernetes/coredns-deployment.yml 파일 직접 수정하여 nodeSelector에 labels 추가

### 2) dns-autoscaler 의 값을 수정하여 coreDNS Pod 수 감소

- **deployment.apps/dns-autoscaler** 가 coreDNS 수를 설정 하고 있음
- dns-autoscaler는 coreDNS의 replica를 아래의 수식 결과로 설정
    
    ```bash
    replicas = max( ceil( cores × 1/coresPerReplica ) , ceil( nodes × 1/nodesPerReplica ) )
    ```
    
    - 현재 사용하고 있는 Worker node의 core 수가 굉장히 높아서 위의 수식에 따라 계산했을 경우, 값이 높게 나오기 때문에 CoreDNS pod 도 많이 생성되고 있었음
- dns-autoscaler configmap의 data 값을 수정
    - k edit configmap dns-autoscaler -n kube-system
    
    ```json
    linear: '{
    	"coresPerReplica":1024,
    	"min":2,
    	"nodesPerReplica":16,
    	"preventSinglePointFailure":true
    }'
    ```
    
    - coresPerReplica의 기본값이 128로 설정되어 있었고, 1024로 변경
    - 추후에 coreDNS 모니터링해서 적절한 값으로 튜닝이 필요함
  


## Reference
- 팀원분께서 트러블슈팅해주신 내용을 바탕으로 정리한 글입니다. 