---
layout: post
title: "[K8S] Kubespray로 만든 Kubernetes 클러스터의 Master 1번 Node 장애 복구"
date: 2023-05-07
categories:
  - tech/kubernetes
tags: [
    k8s,
    kubespray,
    failure,
  ]
---
## Description

- **Kubernetes** 클러스터의 **Master Node**에서 `Disk 장애`가 발생함

```bash
[HAWKEYE] kernel::  [22329228.540857] blk_update_request: I/O error, dev sda, sector 795030104 op 0x0:(READ) flags 0x0 phys_seg 1 prio class 0, at 
```

- 디스크 장애로 인해 sda 영역이 Read only 상태로 바뀌었고, 디스크 교체 및 OS 재설치가 필요한 상황이 발생
- 해당 Kubernetes 클러스터는 Kube-spray 기반으로 클러스터가 구성되어 있음
- Master 노드는 3개의 노드로 HA 구성이 되어있지만, Kube spray 특성 상 Master 1번 노드에 특별한 권한이 부여되어 있어서 1번 노드의 장애 복구는 매우 까다로움

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/5b38a65c-f0d7-49af-b035-f8f6fa665895)

- [(우리와 똑같은 이슈! )](https://github.com/kubernetes-sigs/kubespray/issues/7542)

## Cause

- 하드웨어 장애 발생으로 인해 Kubernetes 의 First Control plane Node 가 죽음

## Solution

### 1번 master 노드의 역할 바꾸기

1. Kube spary 의 Inventory 파일에서 Control plane의 순서를 바꾼다.

```bash
[kube_control_plane]
 node-1
 node-2
 node-3

-> 

[kube_control_plane]
 node-2
 node-3
 node-1
```

1. 하드웨어 장애가 발생한 1번 장비를 클러스터로부터 Remove 작업 수행
2. Cluster-info configmap을 수정해준다.
- old control plane 장비의 IP를 살아있는 장비로 바꿔주고, `certificate-authority-data` 값을 바꿔준다.

```bash
kubectl edit cm -n kube-public cluster-info
```

1. 새로운 Control plane 노드를 추가한다.

### Kubelet 등 여러 컴포넌트 설치 및 구성

```bash
# swapoff
sudo swapoff -a

# systemd-resolved 실행
sudo systemctl start systemd-resolved.service

# docker 설치
sudo apt-get install docker
mkdir -p /etc/systemd/system/docker.service.d
sudo systemctl daemon-reload
sudo systemctl enable docker.service
sudo systemctl start docker.service

# nf conntrack 설치
sudo apt-get install -y conntrack

# kubeadm 설치
chmod 750 kubeadm
sudo mv kubeadm /usr/local/bin/

# Kubelet 설치
sudo mv kubelet /usr/local/bin/ && sudo chmod 750 /usr/local/bin/kubelet
sudo vi /etc/systemd/system/kubelet.service

sudo systemctl enable kubelet.service

# copy certificates
mkdir -p /etc/kubernetes/ssl/
#copy /etc/kubernetes/ssl

mkdir -p /etc/ssl/etcd/ssl
#copy /etc/ssl/etcd/ssl

# CNI 설치
sudo mkdir -p /opt/cni/bin
sudo mv cni-plugins-linux-amd64-v0.9.1.tgz /opt/cni/bin
tar -xvf cni-plugins-linux-amd64-v0.9.1.tgz

# control plane 추가
sudo kubeadm token create --print-join-command
sudo kubeadm join X.X.X.X:6443 --token X --discovery-token-ca-cert-hash sha256:X --control-plane --v=5 --skip-phases control-plane-join/etcd
```

### etcd 노드 추가하기

3개의 Control plane 노드에서 1개 이상의 장비가 죽는다는 것은 Kubernetes 에서 가장 중요한 `etcd` 내부의 **Quorum 이 깨진다는 것**을 의미함. 따라서 노드가 Fail 되기 전에 etcd 를 다시 recover 해주어야 한다.

## Reference

- https://kubespray.io/#/docs/nodes