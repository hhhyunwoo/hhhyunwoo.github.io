---
layout: post
title: "[K8S] Worker Node의 Kubelet IP 변경하기"
date: 2023-06-20
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

GPU 장비 상면 이전을 진행하였는데, 이때 장비의 IP가 변경되었다. 해당 장비는 Kubernetes 클러스터의 Worker 노드로 사용되고 있었고, 노드 삭제 및 추가는 따로 진행하지 않았다.

즉, 상면 이전을 진행하는데 단순 Schedule Disabled 만 해둔 상태. 

이때 해당 장비의 IP가 바뀌었다는 것을 Kubelet은 직접 알지 못한다. 따라서 `노드를 삭제하고 추가해주는 작업`을 해주거나, `Kubelet이 바라보는 IP 를 업데이트 된 IP로 수정`해주는 작업이 필요함

그렇지 않으면 아래와 같은 에러가 발생하면서 Kubelet 과의 소통에서 Timeout 이 발생함

```bash
dial tcp 10.240.0.4:10250: i/o timeout
```

### Kubelet 설정 추가하기

Kubelet은 현재 systemd 서비스 단위로 구성되어있다. 따라서 이에 대한 옵션을 추가하기 위해서는 `/etc/systemd/system/kubelet.service` 파일의 수정이 필요하다. 

```bash
[Unit]
Description=Kubernetes Kubelet Server
Documentation=https://github.com/GoogleCloudPlatform/kubernetes
After=docker.service
Wants=docker.socket

[Service]
User=root
EnvironmentFile=-/etc/kubernetes/kubelet.env
ExecStart=/usr/local/bin/kubelet \
		$KUBE_LOGTOSTDERR \
		$KUBE_LOG_LEVEL \
		$KUBELET_API_SERVER \
		$KUBELET_ADDRESS \
		$KUBELET_PORT \
		$KUBELET_HOSTNAME \
		$KUBELET_ARGS \
		$DOCKER_SOCKET \
		$KUBELET_NETWORK_PLUGIN \
		$KUBELET_VOLUME_PLUGIN \
		$KUBELET_CLOUDPROVIDER \
		$KUBELET_EXTRA_ARGS --node-ip 10.00.00.101
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

`-node-ip string`

- Node 의 IP 주소값을 넣어줄 수 있음. 설정되지 않는다면 kubelet은 노드의 기본 IPv4 주소값을 사용하거나 IPv6 주소를 사용한다.
- ref. [https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/)

`$KUBELET_EXTRA_ARGS --node-ip 10.164.136.20` 값을 ExecStart 에 추가해주면서 새롭게 업데이트 된 Node IP 를 직접 명시해준다. 

### Kubelet  config 적용 및 재시작

```bash
systemctl daemon-reload && systemctl restart kubelet
```

### Node IP 확인

```python
 kubectl get nodes -owide dummy-host
NAME                  STATUS   ROLES    AGE      VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME
dummy-host   Ready    <none>   3y154d   v1.15.1   10.00.00.101   <none>        Ubuntu 18.04.3 LTS   4.15.0-74-generic   docker://18.9.7
```

INTERNAL-IP 값이 업데이트 된 것을 확인할 수 있다.