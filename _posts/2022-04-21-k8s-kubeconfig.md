---
layout: post
title: "[K8S] Kubectx 사용 시 선택한 kubeconfig 를 제대로 못 불러오는 문제 해결"
date: 2022-04-21
categories:
  - tech/kubernetes
tags:
  [
    kubernetes,
    k8s,
    blog,
    jekyll,
    jekyll theme,
    NexT theme,
    Computer Science,
    컴퓨터공학,
    개발,
    소프트웨어,
    지킬 테마,
    지킬 블로그 포스팅,
    GitHub Pages,
  ]
---

# Kubectx 사용 시 선택한 kubeconfig 를 제대로 못 불러오는 문제 해결

- [DOCS](https://kubernetes.io/ko/docs/tasks/access-application-cluster/configure-access-multiple-clusters/) 여기에 거의 모든 정보가 나와있다.

나는 [Kubectx](https://github.com/ahmetb/kubectx) 라는 툴을 사용해서 다중 클러스터를 선택하고 있다. (매우 유용함!!)

근데 클러스터 몇 개를 추가했더니, 선택한 새로운 클러스터 정보를 가져오는 것이 아니라 계속 똑같은 정보만 가져오는 것이다...

좀 살펴봤더니 Kubectl의 Config 정보에 문제가 있었다.

```bash
kubectl config view
```

위의 명령어를 치면 저장된 kubectl config 값이 출력된다.

```bash
 k config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: foo1
  name: bar1
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: foo2
  name: bar2
contexts:
- context:
    cluster: cluster.local
    user: foobaruser1
  name: foobar1
- context:
    cluster: cluster.local2
    user: foobaruser2
  name: foobar2
- context:
    cluster: cluster.local
    user: foobaruser2
  name: foobar3
current-context: foobaruser1
kind: Config
preferences: {}
users:
- name: foobaruser1
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
- name: foobaruser2
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
```

config 에 대해서 좀 읽을 수 있어야 하는데, 요건 위에 첨부한 `docs`를 참고하자.

쉽게 말해서

`current-context` 값을 참조해서, 해당 `cluster`를 해당 `user`로 로그인해서 접근하는 흐름이다.

근데 내가 겪었던 문제는 `context`의 값이 동일한 경우이다.

무조건 각각 다른 `cluster Name` 과 `User Name`을 가지고 있어야 각자의 `secret`으로 다른 클러스터에 접근할 수 있다.

근데 나는 전달받은 `kubeconfig` 를 사용하다보니 위와 같이 동일한 `clusterName`을 가지고 접근하고 있었다.

> 정리하자면, kubectl config view 명령어로 저장된 config 를 확인해보고 current context가 정확하게 내가 지정한 cluster, user 를 사용하고 있는지! 중복된 값을 사용하고 있지는 않는지 확인해볼 필요가 있겠다!
