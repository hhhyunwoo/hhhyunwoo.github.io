---
layout: post
title: "[NFS] NFS Mount 시 "Unit rpcbind.socket is masked" 에러 발생"
date: 2023-07-04
categories:
  - NFS
tags: [
    nfs,
    rpcbind,
    mount,
  ]
---
## Description

- Kubernetes 의 Pod 명세에서 NFS Mount 를 사용하는데, 해당 Pod가 정상적으로 뜨지 못하고 아래와 같은 에러 발생

```bash
Warning  FailedMount  5m (x87 over 3h)     kubelet  MountVolume.SetUp failed for volume "default-ws-test" : mount failed: exit status 32
Mounting command: mount
Mounting arguments: -t nfs 10.92.25.196:/test/test/test /var/lib/kubelet/pods/testvolumes/kubernetes.io~nfs/default-ws-test
Output: Failed to start rpc-statd.service: Unit rpcbind.socket is masked.
mount.nfs: rpc.statd is not running but is required for remote locking.
mount.nfs: Either use '-o nolock' to keep locks local, or start statd.
```

- 같은 Linux 장비에서 직접 NFS Mount 시에도 아래와 같은 에러 발생

```bash
Failed to start rpc-statd.service: Unit rpcbind.socket is masked
```

## Cause

- NFS Mount 잘 되는 다른 장비에서 디버깅 수행

```bash
deploy@test-test-app22:~$ sudo mount -v -t nfs X.X.X.X:/test /home/test/nfs-test
mount.nfs: timeout set for Wed Mar 15 15:32:27 2023
mount.nfs: trying text-based options 'vers=4.2,addr=X.X.X.X,clientaddr=X.X.X.X'
mount.nfs: mount(2): Protocol not supported
mount.nfs: trying text-based options 'vers=4.1,addr=X.X.X.X,clientaddr=X.X.X.X'
mount.nfs: mount(2): No such file or directory
Failed to start rpc-statd.service: Unit rpcbind.socket is masked.
mount.nfs: rpc.statd is not running but is required for remote locking.
mount.nfs: Either use '-o nolock' to keep locks local, or start statd.
```

- 뭔가 설정이 막혀있는 것으로 확인됨.
- 해당 이슈를 조금 더 서칭해보니, nfs-common 패키지를 설치하고 rpcbind 를 활성화 해야함.
- rpc bind 는 보안상 취약한 패키지로 꼭 필요한 경우가 아니면 설치를 지양하고 있어서, 기본 설정이 비활성화가 되어 있어서 위와 같은 에러가 발생하는 것!
- 따라서 rpcbind 활성화를 해주어야함.

## Solution

- rpcbind 활성화하기

```bash
$ systemctl unmask rpcbind.service rpcbind.socket
$ systemctl enable rpcbind.service rpcbind.socket
```