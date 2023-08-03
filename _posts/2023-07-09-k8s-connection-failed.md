---
layout: post
title: "[K8S] MongoDB Connection Failed 이슈"
date: 2023-07-09
categories:
  - Kubernetes
tags: [
    k8s,
    mongodb,
    failure,
  ]
---
## Description

- Kubernetes Cluster의 **CPU Worker Node** 의 `Flavor 를 리사이징`(**16GB Mem → 32GB Mem**) 하면서 Node가 다운되었다가 다시 올라오는 작업이 진행되었음

1.

이때 MongoDB 가 떠 있는 Node가 다운되면서 **MongoDB의 인증 문제 발생**

```bash
# MongoDB를 연결하고 있는 API server에서 발생한 에러 로그
panic: (ShardingStateNotInitialized) Encountered non-retryable error during query :: caused by :: Cannot accept sharding commands if sharding state has not been initialized with a shardIdentity document
 
panic: connection() error occurred during connection handshake: auth error: sasl conversation error: unable to authenticate using mechanism "SCRAM-SHA-1": (AuthenticationFailed) Authentication failed
```

2.

MongoDB가 정상적으로 돌아오고 나서 Backup 해두었던 MongoDB를 Restore 하는 작업 중 내부적으로 접근 안되는 에러 발생

```bash
ubuntu@test-demo-control-plane-test:~/mybackup$ sudo docker run --rm --name mongodb -v $(pwd):/app --net="host" bitnami/mongodb:latest mongorestore -u root -p $MONGODB_ROOT_PASSWORD /app
mongodb 02:39:18.57
mongodb 02:39:18.57 Welcome to the Bitnami mongodb container
mongodb 02:39:18.57 Subscribe to project updates by watching https://github.com/bitnami/containers
mongodb 02:39:18.57 Submit issues and feature requests at https://github.com/bitnami/containers/issues
 
mongodb 02:39:18.58
2022-10-31T02:39:18.591+0000    WARNING: On some systems, a password provided directly using --password may be visible to system status programs such as `ps` that may be invoked by other users. Consider omitting the password to provide it via stdin, or using the --config option to specify a configuration file with the password.
2022-10-31T02:39:48.592+0000    error connecting to host: could not connect to server: server selection error: server selection timeout, current topology: { Type: Single, Servers: [{ Addr: localhost:27017, Type: Unknown, Last error: connection() error occurred during connection handshake: connection(localhost:27017[-13]) incomplete read of message header: read tcp [::1]:59378->[::1]:27017: i/o timeout }, ] }
```

## Cause

1.

- Mongodb Sharded Cluster 는 시작될 때 Data server가 Config server에 접속하여 Shard list 를 획득함.
- 이 때 key 를 이용한 SCRAM 인증 방식을 이용하는데, [bitnami mongodb-sharded helm](https://github.com/bitnami/charts/tree/master/bitnami/mongodb-sharded)의 경우 이 key를 k8s의 secret config에 저장함.
- 이후, Pod가 생성될 때 각 Pod의 로컬 파일(/opt/bitnami/mongodb/conf/keyfile)에 저장함
    - key file 확인
        
        ```bash
        k exec -it mongodb-mongodb-sharded-configsvr-2 -n mongodb -- cat /opt/bitnami/mongodb/conf/keyfile
        ```
        
- Argocd를 사용하여 각 컴포넌트들의 Sync를 맞추고 있는데, 이번에 노드 리사이징 작업을 수행하면서 Node가 내려가게 되었고 Argocd는 AutoSync 기능에 의해서 MongoDB를 업데이트하게 됨
- 이 때 **Secret config의 key 값**(`secrets/mongodb-mongodb-sharded/mongodb-replica-set-key`)이 변경되면서, **정상 기동 중인 Pod와 새로 기동된 Pod의 Key 값이 다르기 때문에 Authentication Failed 에러가 발생한 것으로 보임**
    - 추후 argocd가 바라보는 mongodb application의 autosync, autoheal 기능을 disable 해두어야 할 필요가 있음

2.

- 기존 백업 시 27017 port-forwarding 수행중인 kubectl 프로세스가 백그라운드로 떠 있었는데, MongoDB 컴포넌트가 죽고 다시 뜨면서 해당 kubectl 프로세스가 바라보는 곳이 잘못되었지 않을까 추측

## Solution

1.

- MongoDB의 PVC를 포함한 모든 리소스(mongos, configsvr, data) rollout restart
- (백업이 꼭 선행되어야 함)

2.

- ps -x 로 기존 27017 포트로 port-forwarding 하고 있는 kubectl 프로세스 kill 후 다시 실행