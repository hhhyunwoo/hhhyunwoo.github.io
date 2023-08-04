---
layout: post
title: "[K8S] host 에서 Kubeadm 으로 Kubernetes 환경 제거하기"
date: 2023-07-12
categories:
  - Kubernetes
tags: [
    k8s,
    kubeadm,
    node,
    delete,
  ]
---
## Description

- `Kubernetes` 클러스터 환경에서 특정 노드를 `Clear` 하고 싶은 경우가 있다.
- 사실 **Node OS 재설치**가 제일 깔끔하고 쉽지만, 인프라 쪽의 도움을 받지 못하는 경우는 Kubernetes 의 컴포넌트들을 직접 삭제해주는 작업이 필요하다.

## Solution

### kubeadm 으로 reset 후 ipvsadm — clear 작업

```bash
test-app14:/etc/apt/trusted.gpg.d# kubeadm reset
[reset] WARNING: Changes made to this host by 'kubeadm init' or 'kubeadm join' will be reverted.
[reset] Are you sure you want to proceed? [y/N]: y
[preflight] Running pre-flight checks
W1215 17:32:36.034825   54565 removeetcdmember.go:79] [reset] No kubeadm config, using etcd pod spec to get data directory
[reset] No etcd config found. Assuming external etcd
[reset] Please, manually reset etcd to prevent further issues
[reset] Stopping the kubelet service
[reset] Unmounting mounted directories in "/var/lib/kubelet"
[reset] Deleting contents of config directories: [/etc/kubernetes/manifests /etc/kubernetes/pki]
[reset] Deleting files: [/etc/kubernetes/admin.conf /etc/kubernetes/kubelet.conf /etc/kubernetes/bootstrap-kubelet.conf /etc/kubernetes/controller-manager.conf /etc/kubernetes/scheduler.conf]
[reset] Deleting contents of stateful directories: [/var/lib/kubelet /etc/cni/net.d /var/lib/dockershim /var/run/kubernetes]
 
The reset process does not reset or clean up iptables rules or IPVS tables.
If you wish to reset iptables, you must do so manually.
For example:
iptables -F && iptables -t nat -F && iptables -t mangle -F && iptables -X
 
If your cluster was setup to utilize IPVS, run ipvsadm --clear (or similar)
to reset your system's IPVS tables.
 
The reset process does not clean your kubeconfig files and you must remove them manually.
Please, check the contents of the $HOME/.kube/config file.

test-app14:/etc/apt/trusted.gpg.d# ipvsadm --clear
```

### Docker 삭제

```bash
test-app14:/etc/apt/trusted.gpg.d# sudo docker version
test-app14:/etc/apt/trusted.gpg.d# apt remove docker-ce
```

### 혹시나 network cni 이슈가 발생한다면 아래의 작업을 수행해야함

- CNI 이슈 예시

```bash
(combined from similar events): Failed to create pod sandbox: rpc error: code = Unknown desc = failed to set up sandbox container "XX" network for pod "gpu-monitoring-dcgm-exporter-jv4t6": networkPlugin cni failed to set up pod "gpu-monitoring-dcgm-exporter-jv4t6_gpu-monitoring" network: failed to set bridge addr: "cni0" already has an IP address different from X.X.X.X/25
```

- 네트워크 설정 작업

```bash
# sudo -i
# ip link set cni0 down && ip link set flannel.1 down
# ip link delete cni0 && ip link delete flannel.1
# systemctl restart docker && systemctl restart kubelet
```
## Reference
- 팀원분께서 트러블슈팅해주신 내용을 바탕으로 정리한 글입니다. 