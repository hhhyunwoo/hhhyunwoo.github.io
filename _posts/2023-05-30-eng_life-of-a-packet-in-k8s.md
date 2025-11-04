---
layout: post
title: "[번역] Life of a Packet in Kubernetes— Part 3"
date: 2023-05-30
categories:
  - mentoring/translations
tags:
  [
    kubernetes,
    packet,
    network,
    translation,
    cni,
    iptables,
    kube-proxy,
  ]
---

> [**해당 Posting**](https://dramasamy.medium.com/life-of-a-packet-in-kubernetes-part-3-dd881476da0f) 을 공부하며 번역하는 글입니다.
> 

이번 포스팅은 “`쿠버네티스에서 패킷의 삶`” 이라는 주제의 파트 3입니다. 

이제부터 쿠버네티스의 `kube-proxy` 컴포넌트가 `iptables` 를 사용하여서 어떻게 트래픽을 컨트롤하는지 알아볼 것입니다. 

쿠버네티스 환경에서 `kube-proxy` 의 역할을 이해하고 `iptables`를 사용하여 어떻게 트래픽을 컨트롤하는지 아는 것은 매우 중요한 부분입니다.

Note : 트래픽 흐름을 제어하는데 사용할 수 있는 툴과 플러그인은 매우 다양하지만 여기서는 `kube-proxy + iptables` 콤보를 이용해서 알아보겠습니다. 

일단 먼저 쿠버네티스에서 제공하는 다양한 커뮤니케이션 모델들과 그들의 구현에 대해서 알아보겠습니다. 

만약 여러분이 `Service`, `ClusterIP`, `Noteport` 의 개념에 대해서 잘 알고계신다면, `kube-proxy/iptables` 챕터로 넘어가도 되겠습니다! 

## **Part 1 — [Basic container networking](https://dramasamy.medium.com/life-of-a-packet-in-kubernetes-part-1-f9bc0909e051?source=friends_link&sk=9525ced03e4683afca531c21914625eb)**

## **Part 2 — [Calico CNI](https://dramasamy.medium.com/life-of-a-packet-in-kubernetes-part-2-a07f5bf0ff14?source=friends_link&sk=2e9f25db9d4f5d9ca85ecd3a08db1c07)**

## **Part 3:**

1. Pod-to-Pod
2. Pod-to-External
3. Pod-to-Service
4. External-to-Pod
5. External Traffic Policy
6. Kube-Proxy
7. iptable rules processing flow
8. Network Policy basics

## **Kube-Proxy (iptable mode)**

쿠버네티스에서 Service 를 구현하는 컴포넌트는 Kube-proxy 입니다. 

모든 노드에 존재하며 파드와 서비스 간에 다양한 종류의 필터링과 NAT 를 수행할 수 있도록 복잡한 iptables 룰들이 프로그램되어있습니다.

> **NAT** `(Network Address Translation)` 란?
→ IP 패킷에 있는 출발지 및 목적지의 IP 주소와 TCP/UDP 포트 숫자 등을 바꿔 재기록하면서 네트워크 트래픽을 주고 받게하는 기술입니다.
> 

> **iptables** 이란?
→ 커널 상에서 netfilter 패킷 필터링 기능을 제어하는 기능입니다. 패킷의 해더를 보고 그 전체 패킷의 방향을 결정하게 됩니다.
> 

여러분이 쿠버네티스 클러스터의 노드에 가서 `iptables-save` 명령어를 날리게 되면, 쿠버네티스 혹은 다른 프로그램들에 의해 삽입된 룰들을 확인하실 수 있을 겁니다. 

그 중 가장 중요한 Chain 들은 `KUBE-SERVICES`, `KUBE-SVC-*` 와 `KUBE-SEP-*` 입니다. 

- `KUBE-SERVICES` 는 서비스 패킷들의 앤트리 포인트입니다. 목적지의 IP:Port 를 매칭해주고 적합한 `KUBE-SVC-*` 체인으로 패킷을 보내줍니다.
- `KUBE-SVC-*` 체인은 로드밸런서 역할을 수행하며 패킷들을 `KUBE-SEP-*` 체인으로 동일하게 보내줍니다. 각각의 `KUBE-SVC-*` 는 `KUBE-SEP-*` 체인과 같은 개수가 존재하는데, 이는 엔드포인트의 수와 동일합니다.
- `KUBE-SEP-*` 체인은 `S`ervice `E`nd`P`oint 를 뜻합니다. 이는 단순하게 DNAT 를 수행하는데 즉, 서비스 IP:Port 를 파드의 엔드포인트 IP:Port 로 변환해줍니다.

### What is DNAT and SNAT

- DNAT : Destination NAT
    - 도착지 주소를 변경하는 NAT
- SNAT : Source NAT
    - 출발지 주소를 변경하는 NAT

DNAT 에 대해서는, conntrack 가 시작되고 상태 머신을 이용하여 상태 연결을 기록하기 시작합니다. 변경된 대상 주소를 기억하고, 반환 패킷이 돌아왔을 때 다시 변경해야 하므로 상태가 필요합니다. 

Iptables 는 패킷의 운명을 결정하기 위해서 conntrack 의 상태 (cstate)에 의존합니다. 

아래의 4가지 conntrack 상태는 특히 중요합니다.

- NEW : conntrack 는 SYN 패킷을 받았을 때 발생하는 이 패킷에 대해서 전혀 모릅니다.
- ESTABLISHED : conntrack 는 패킷이 handshake 가 완료된 이후에 발생하는 established connection에 속한다는 것을 알고 있습니다.
- RELATED : 패킷은 어떠한 연결에도 속해있지 않지만 다른 연결과 제휴를 맺고있습니다. 이는 FTP와 같은 프로토콜에 특히 굉장히 유용합니다.
- INVALID : 패킷에 관하여 어떠한 것이 문제가 있고 conntrack 은 어떻게 처리해야하는지 모릅니다. 이 상태는 Kubernetes 상에서 중요한 역할을 수행합니다.

아래는 pod 와 서비스 간에 어떻게 TCP 연결이 이루어지는지를 나타냅니다. 

순차적인 이벤트는 아래와 같습니다.

- 왼쪽에 있는 클라이언트 Pod 는 서비스(2.2.2.10:80) 로 패킷을 보냅니다
- 패킷은 클라이언트 노드에 있는 iptable 룰을 통과합니다. 그리고 목적지는 pod IP, 1.1.1.20:80 으로 변경됩니다.
- 서버 Pod 는 패킷을 처리하고 다시 패킷을 1.1.1.10 을 목적지로 보냅니다.
- 패킷은 클라이언트 노드로 돌아오고, conntrack 은 패킷을 인식하고 출발지 주소를 2.2.2.10:80 으로 다시 수정합니다.
- 클라이언트 Pod 는 응답 패킷을 받습니다.

![image](https://miro.medium.com/v2/resize:fit:1400/1*1u1d1WU1SqTiiJFyHO-X_A.gif){: .align-center}


## iptables

리눅스 운영체제에서 방화벽 운영은 `netfilter` 를 사용하여 운영됩니다. 이는 커널 모듈에서 어떤 패킷들이 들어오고 나갈지를 허용하는 부분입니다. 

`iptables` 는 단순히 `netfilter` 의 인터페이스입니다. 이 두가지는 종종 같은 것으로 고려되기도 합니다. 더 나은 관점은 이들을 Backend(netfilter)와 Frontend(iptables)로 바라보는 것입니다.

### Chains

각각의 체인들은 특정 업무에 대한 책임이 있습니다.

- PREROUTING
    - 이 체인은 패킷이 네트워크 인터페이스에 도착하자마자 어떤 일이 발생할지를 결정합니다. 여러가지 옵션이 있는데, 예를 들어 패킷을 바꾼다거나*(아마도 NAT)*, 패킷을 누락시킨다거나, 아무것도 하지않고 지나가게해서 다른 곳에서 처리하도록 하는 것들이 있습니다.
- INPUT
    - 이 체인은 가장 인기있는 체인 중 하나이고 우리의 컴퓨터를 해치려고 하는 나쁜 요소들을 피하기 위해서 항상 거의 엄격한 규칙을 포함하고 있습니다. 만약 당신이 포트를 열거나 닫고 싶다면, 이 부분이 당신이 수행해야하는 부분입니다.
- FORWARD
    - 이 체인은 이름에서 확인할 수 있듯이 패킷의 포워딩에 책임이 있습니다. 우리가 만약 컴퓨터를 라우터로 사용하고 싶으면, 이 체인이 우리가 적용해야하는 부분입니다.
- OUTPUT
    - 이 체인은 다른 많은 웹 브라우징이 담당하는 부분입니다. 이 체인이 허락하지 않는다면 당신은 하나의 패킷도 보낼 수 없습니다. 포트가 통신할지 말지 관계없이, 수 많은 옵션들이 존재합니다. 만약 응용 프로그램이 어떤 포트를 사용할지 확실하지 않다면, 아웃바운드 트래픽을 제한하는데 가장 좋은 방법입니다.
- POSTROUTING
    - 이 체인은 패킷이 컴퓨터를 떠나기 전에 마지막으로 추적을 남기는 곳입니다. 여러 작업 중에서 우리가 원하는데로 패킷이 잘 흘러가는지를 확인하는데 사용됩니다.
<img width="914" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/2c02f261-a423-4a8a-9769-c65dfee15fce">

**FORWARD** 체인은 리눅스 서버에서 `ip_forward` 가 enabled 일때만 사용이 가능합니다. 따라서 Kubernetes 클러스터를 구축하고 디버깅하는데 아래의 커맨드는 매우 중요합니다. 

```bash
node-1$ sysctl -w net.ipv4.ip_forward=1
net.ipv4.ip_forward = 1
node-1$ cat /proc/sys/net/ipv4/ip_forward
1
```

위의 변화는 지속적이지 않습니다. 리눅스 시스템에서 해당 IP를 영구적으로 이용가능하게 하기위해서는 `/etc/sysctl.conf` 파일을 아래와 같이 수정해야합니다.

```bash
net.ipv4.ip_forward = 1
```

## tables

이제부터 우린 NAT 테이블에 초점을 맞출 예정이지만, 아래는 사용가능한 테이블들에 대한 설명입니다.

- Filter
    - 기본 테이블입니다. 이 테이블에서는 패킷이 당신의 컴퓨터로 들어올지 말지를 결정합니다. 만약 포트를 막아서 더 이상 아무것도 받고싶지 않다면 이 부분을 멈춰야합니다.
- Nat
    - 이 테이블은 두번째로 인기있는 테이블이고 새로운 연결을 생성하는데 책임이 있습니다. Network Address Translation 의 줄임말이기도 합니다. 만약 당신이 이 용어에 익숙하지 않아도 괜챃습니다. 아래에서 자세하게 설명하겠습니다.
- Mangle
    - 특별한 패킷만을 다룹니다. 이 테이블은 들어오고 나가는 패킷 내부의 무언가를 변경합니다.
- Raw
    - 이 테이블은 이름에서 추측할 수 있듯이 raw 패킷을 다룹니다. 주로 연결 상태를 추적합니다. 아래에서 SSH 연결에서 성공한 패킷을 허가하는 예시를 살펴보겠습니다.
- Security
    - Filter Table 다음으로 컴퓨터 보안을 담당합니다. [SELinux](https://www.redhat.com/en/topics/linux/what-is-selinux) 를 포함하고 있습니다. 만약 이 용어와 익숙하지 않다면, 이것은 현대 리눅스 배포판에서 강력한 보안툴입니다.

> 만약 iptables 에 대해서 조금 더 자세하기 알고 싶다면 [이 칼럼](https://www.digitalocean.com/community/tutorials/a-deep-dive-into-iptables-and-netfilter-architecture)을 읽어주시기 바랍니다.
> 

## iptable configuration in Kubernetes

자, 이제부터 2개의 래플리카를 가진 **Nginx** 애플리케이션을 minikube에 배포해보고 iptable 규칙을 덤프해봅시다.

서비스 타입 : NodePort

```bash
master $ kubectl get svc webapp
NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
webapp NodePort 10.103.46.104 <none> 80:31380/TCP 3d13h
master $ kubectl get ep webapp 
NAME ENDPOINTS AGE
webapp 10.244.120.102:80,10.244.120.103:80 3d13h
master $
```

위와 같이 Endpoint 를 조회해보면, ClusterIP 는 어디에도 존재하지 않습니다. 다만, 아래에서 볼 수 있듯이 virtual IP 는 iptable Kubernetes 에 존재하고 CoreDNS에 DNS 항목을 추가합니다. 

```bash
master $ kubectl exec -i -t dnsutils -- nslookup webapp.default
Server:  10.96.0.10
Address: 10.96.0.10#53
Name: webapp.default.svc.cluster.local
Address: 10.103.46.104
```

패킷에 필터링과 NAT를 하기위해서 Kubernetes 는 iptable에 커스텀 체인인 **`KUBE-SERVICES`**를 생성할 것입니다. 

아래에서 볼 수 있듯이 해당 체인은 모든 `PREROUTING AND OUTPUT` 트래픽을 커스텀 체인인 `**KUBE-SERVIES**` 로 리다이렉트 할 것 입니다. 

```bash
$ sudo iptables -t nat -L PREROUTING | column -t
Chain            PREROUTING  (policy  ACCEPT)
target           prot        opt      source    destination
cali-PREROUTING  all         --       anywhere  anywhere     /*        cali:6gwbT8clXdHdC1b1  */
**KUBE-SERVICES**    all         --       anywhere  anywhere     /*        kubernetes             service   portals  */
DOCKER           all         --       anywhere  anywhere     ADDRTYPE  match                  dst-type  LOCAL
```

`KUBE-SERVICES` 체인 훅을 패킷 필터링과 NAT 로 사용한 후에, Kubernetes 는 자신의 서비스로 들어오는 트래픽을 감지할 수 있고 SNAT/DNAT를 올바르게 적용할 수 있습니다. 

`**KUBE-SERVICES**` 체인 마지막에는, 특정 서비스 타입인 NODEPORT 에서 트래픽을 조작하기 위해서 `**KUBE-NODEPORTS**` 라는 커스텀 체인을 설치해줍니다. 

만약 트래픽이 `ClusterIP 서비스 타입`으로 들어오는 것이라면, `KUBE-SVC-2IRACUALRELARSND` 체인이 트레픽을 처리할 것입니다. 그것이 아니라면 그 다음 체인인 `KUBE-NODEPORTS` 체인에서 트레픽을 처리할 것입니다. 

```bash
$ sudo iptables -t nat -L KUBE-SERVICES | column -t
Chain                      KUBE-SERVICES  (2   references)                                                                                                                                                                             
target                     prot           opt  source          destination                                                                                                                                                             
**KUBE-MARK-MASQ**             tcp            --   !10.244.0.0/16  10.103.46.104   /*  default/webapp                   cluster  IP          */     tcp   dpt:www                                                                          
**KUBE-SVC-2IRACUALRELARSND**  tcp            --   anywhere        10.103.46.104   /*  default/webapp                   cluster  IP          */     tcp   dpt:www                                                                                                                                             
**KUBE-NODEPORTS**             all            --   anywhere        anywhere        /*  kubernetes                       service  nodeports;  NOTE:  this  must        be  the  last  rule  in  this  chain  */  ADDRTYPE  match  dst-type  LOCAL
```

자, 그럼 이제 `KUBE-NODEPORTS` 부분에 대해서 알아봅시다.

*(제 환경 같은 경우는 k8s v1.21.6 버전을 사용하고있는데요, KUBE-NODE-PORT 라는 이름의 체인으로 등록이 되어있습니다. K8S 버전에 따라 상이한 부분이 있는 듯 합니다.)*

```bash
$ sudo iptables -t nat -L KUBE-NODEPORTS | column -t
Chain                      KUBE-NODEPORTS  (1   references)                                            
target                     prot            opt  source       destination                               
KUBE-MARK-MASQ             tcp             --   anywhere     anywhere     /*  default/webapp  */  tcp  dpt:31380
KUBE-SVC-2IRACUALRELARSND  tcp             --   anywhere     anywhere     /*  default/webapp  */  tcp  dpt:31380
```

이제 이 부분부터는 ClusterIP 와 NodePort 의 처리 과정이 동일합니다. 

아래에서 나오는 iptable의 다이어그램을 참고해주세요 

```bash
# Statistic mode random -> Random load-balancing between endpoints
$ sudo iptables -t nat -L KUBE-SVC-2IRACUALRELARSND | column -t
Chain                      KUBE-SVC-2IRACUALRELARSND  (2   references)                                                                             
target                     prot                       opt  source       destination                                                                
KUBE-SEP-AO6KYGU752IZFEZ4  all                        --   anywhere     anywhere     /*  default/webapp  */  statistic  mode  random  probability  0.50000000000
KUBE-SEP-PJFBSHHDX4VZAOXM  all                        --   anywhere     anywhere     /*  default/webapp  */

$ sudo iptables -t nat -L KUBE-SEP-AO6KYGU752IZFEZ4 | column -t
Chain           KUBE-SEP-AO6KYGU752IZFEZ4  (1   references)                                               
target          prot                       opt  source          destination                               
KUBE-MARK-MASQ  all                        --   10.244.120.102  anywhere     /*  default/webapp  */       
DNAT            tcp                        --   anywhere        anywhere     /*  default/webapp  */  tcp  to:10.244.120.102:80

$ sudo iptables -t nat -L KUBE-SEP-PJFBSHHDX4VZAOXM | column -t
Chain           KUBE-SEP-PJFBSHHDX4VZAOXM  (1   references)                                               
target          prot                       opt  source          destination                               
KUBE-MARK-MASQ  all                        --   10.244.120.103  anywhere     /*  default/webapp  */       
DNAT            tcp                        --   anywhere        anywhere     /*  default/webapp  */  tcp  to:10.244.120.103:80

$ sudo iptables -t nat -L KUBE-MARK-MASQ | column -t
Chain   KUBE-MARK-MASQ  (24  references)                         
target  prot            opt  source       destination            
MARK    all             --   anywhere     anywhere     MARK  or  0x4000
```

*Note : 가독성을 위해서 결과를 잘라내어 필요한 부분들만 보여주는 것입니다.*

### ClusterIP:

- KUBE-SERVICES → KUBE-SVC-XXXX → KUBE-SEP-XXX

### NodePort:

- KUBE-SERVICES → KUBE-NODEPORTS → KUBE-SVC-XXX → KUBE-SEP-XXX

*Note: NodePort 서비스는 내부와 외부 트래픽 관리를 위해 할당된 ClusterIP 가 있습니다.*

시각적으로 표현된 도표는 아래와 같습니다. 

<img width="914" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/b2d86c94-9c26-41e2-9d2d-b6173d7bdbff">

### ExternalTrafficPolicy: Local

이전에 논의된 것 처럼, “externalTrafficPolicy: Local” 을 사용하는 것은 Source IP 를 보존할 수 있고 Local endpoint 가 없는 곳에서 들어오는 패킷은 drop 할 수 있습니다. 

즉, 외부 트래픽에 대한 응답으로 `Service`가  노드 안 (Local)에서만 응답을 할 것인지, 아니면 Cluster 전체 (Cluster) 로 나아가서 응답할지 결정하는 옵션입니다. 

*추가적으로 externalTrafficPolicy : Cluster 로 전체 응답하는 것이 Default 값입니다.* 

local endpoint 가 없는 경우에 대해서 iptable을 조금 더 들여다 보죠. 

```bash
master $ kubectl get nodes
NAME           STATUS   ROLES    AGE    VERSION
minikube       Ready    master   6d1h   v1.19.2
minikube-m02   Ready    <none>   85m    v1.19.2
```

이제 externalTrafficPolicy Local 을 가진 Nginx 을 배포해보겠습니다!

```bash
master $ kubectl get pods nginx-deployment-7759cc5c66-p45tz -o wide
NAME                                READY   STATUS    RESTARTS   AGE   IP               NODE       NOMINATED NODE   READINESS GATES
nginx-deployment-7759cc5c66-p45tz   1/1     Running   0          29m   10.244.120.111   minikube   <none>           <none>
```

externalTrafficPolicy 를 확인해보죠, 

```bash
master $ kubectl get svc webapp -o wide -o jsonpath={.spec.externalTrafficPolicy}
Local
```

서비스를 가져와보겠습니다.

```bash
master $ kubectl get svc webapp -o wide
NAME     TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE   SELECTOR
webapp   NodePort   10.111.243.62   <none>        80:30080/TCP   29m   app=webserver
```

그럼 이제 minikube-m02 노드에 적용되어있는 iptables 를 확인해보게습니다. 

local endpoint 가 아니라면 패킷을 `DROP` 하는 룰이 적용되어있을 것입니다! 

```bash
$ sudo iptables -t nat -L KUBE-NODEPORTS
Chain KUBE-NODEPORTS (1 references)
target prot opt source destination
KUBE-MARK-MASQ tcp — 127.0.0.0/8 anywhere /* default/webapp */ tcp dpt:30080
**KUBE-XLB-2IRACUALRELARSND** tcp — anywhere anywhere /* default/webapp */ tcp dpt:30080
```

**`KUBE-XLB-2IRACUALRELARSND`** 를 확인해보겠습니다.

```bash
$ sudo iptables -t nat -L KUBE-XLB-2IRACUALRELARSND
Chain KUBE-XLB-2IRACUALRELARSND (1 references)
target prot opt source destination
KUBE-SVC-2IRACUALRELARSND all — 10.244.0.0/16 anywhere /* Redirect pods trying to reach external loadbalancer VIP to clusterIP */
KUBE-MARK-MASQ all — anywhere anywhere /* masquerade LOCAL traffic for default/webapp LB IP */ ADDRTYPE match src-type LOCAL
KUBE-SVC-2IRACUALRELARSND all — anywhere anywhere /* route LOCAL traffic for default/webapp LB IP to service chain */ ADDRTYPE match src-type LOCAL
**KUBE-MARK-DROP** all — anywhere anywhere /* default/webapp has no local endpoints */
```

조금 더 자세히 들여다보면, Cluster Level의 트래픽에서는 전혀 문제가 없습니다. 오직 nodePort 트래픽이 이 노드에서 drop 될 것 입니다. 

‘minikube’ 노드(master) 의 iptable 룰입니다.

```bash
$ sudo iptables -t nat -L KUBE-NODEPORTS
Chain KUBE-NODEPORTS (1 references)
target prot opt source destination
KUBE-MARK-MASQ tcp — 127.0.0.0/8 anywhere /* default/webapp */ tcp dpt:30080
KUBE-XLB-2IRACUALRELARSND tcp — anywhere anywhere /* default/webapp */ tcp dpt:30080

$ sudo iptables -t nat -L KUBE-XLB-2IRACUALRELARSND
Chain KUBE-XLB-2IRACUALRELARSND (1 references)
target prot opt source destination
KUBE-SVC-2IRACUALRELARSND all — 10.244.0.0/16 anywhere /* Redirect pods trying to reach external loadbalancer VIP to clusterIP */
KUBE-MARK-MASQ all — anywhere anywhere /* masquerade LOCAL traffic for default/webapp LB IP */ ADDRTYPE match src-type LOCAL
KUBE-SVC-2IRACUALRELARSND all — anywhere anywhere /* route LOCAL traffic for default/webapp LB IP to service chain */ ADDRTYPE match src-type LOCAL
KUBE-SEP-5T4S2ILYSXWY3R2J all — anywhere anywhere /* Balancing rule 0 for default/webapp */

$ sudo iptables -t nat -L KUBE-SVC-2IRACUALRELARSND
Chain KUBE-SVC-2IRACUALRELARSND (3 references)
target prot opt source destination
KUBE-SEP-5T4S2ILYSXWY3R2J all — anywhere anywhere /* default/webapp */
```

## **Headless Services**

> Kubernetes Docs 에서 가져온 내용
> 

가끔씩 로드밸런싱이 필요없고 Service IP 하나만 필요할 때가 있습니다. 이런 경우, 당신은 Cluster IP (`.spec.clusterIP`) 에 “`None`”을 특정해서, ‘headless’ 라는 용어를 가진 서비스를 만들 수 있습니다.

Kubernetes의 구현체에 묶이지 않고, 다른 Discovery Mechanisms 사용할 때 헤드리스 서비스 인터페이스를 사용할 수 있습니다.

헤드리스 `Services` 에서 Cluster IP는 할당되지 않고, Kube-proxy 는 이 서비스를 처리하지 않습니다. 또한 플랫폼 상에서의 로드벨런싱 혹은 Proxying 은 존재하지 않습니다. 

DNS가 어떻게 자동으로 구성되는지는 서비스가 Selector 를 가지고 있는지에 따라 달라집니다.

### With selectors

Selector 가 정의된 헤드리스 서비스에서는 엔드포인트 컨트롤러가 API를 이용해 `Endpoints` 를 기록하고 `Service` 뒤쪽에 위치한 `Pod` 로 직접 찌를 수 있도록 DNS 구성을 변경합니다.

```bash
master $ kubectl get svc webapp-hs
NAME        TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
webapp-hs   ClusterIP   None         <none>        80/TCP    24s

master $ kubectl get ep webapp-hs
NAME        ENDPOINTS                             AGE
webapp-hs   10.244.120.109:80,10.244.120.110:80   31s
```

### Without selectors

Selector 가 정의되지 않은 헤드리스 서비스의 경우 엔드포인트 컨트롤러가 `Endpoint`  리소스를 생성하지 않습니다.

하지만 DNS 시스템은 다음 중 하나를 선택하여 구성합니다.

- `ExternalName` type 서비스인 경우  `CNAME 레코드` 반환
- 다른 모든 타입의 서비스와 이름을 공유하는 아무 Endpoint 의 `A 레코드`를 반환

만약 하나 혹은 그 이상의 클러스터 노드로 라우팅 해주는 External IP들이 존재한다면, Kubernetes 서비스는 이 external IPs 들로 노출될 수 있습니다. 

Service Port 의 external IP 를 통해 클러스터로 들어오는 트래픽들은 Service 엔드포인트 중 하나로 라우팅 될 것입니다. `external IPs` 는 Kubernetes 에 의해 관리되지 않고, 클러스터 관리자가 이들을 책임지고 관리해야합니다.

## Network Policy

이정도 살펴보았으면, 아마 Kubernetes 에서 Network Policy 가 어떤식으로 구현되어있는지 감이 오실 것입니다. 

네 맞습니다, `iptables` 가 또 나옵니다. 이번에는 Kube-proxyt가 아니라 CNI 가 Network Policy 구현에 신경을 쓰게 됩니다. 

이번 섹션은 Calico(Part 2) 가 추가 되어야만 하지만, 지금쯤 Network Policy의 디테일이 나오는 것이 맞다고 생각했습니다. 

자, 3가지 서비스를 만들어보죠. Frontend, Backend 그리고 DB

기본적으로, Pods 는 non-isolated 되어있습니다. 즉, 어디서 들어오든지 모든 트래픽을 수용합니다.

<img width="909" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/629899e9-df01-47ac-8b8c-390b375da0ed">

하지만, Frontend 와 DB간의 트래픽 흐름을 피하기 위해서는 FrondEnd 파드에서 DB 파드로의 트래픽을 제어할 필요가 있습니다.

<img width="912" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/05d3f6bc-44c9-4fa0-87a0-f1000239471e">

Network Policy 구성에 대해서 이해하기 위해서는 [이 칼럼](https://cloud.redhat.com/blog/guide-to-kubernetes-ingress-network-policies)을 읽어보는 것을 권장합니다. 이번 섹션은 Netowork Policy 구성에 대한 딥 다이브 대신 Kubernetes에서 Network Policy가 어떻게 구현되었는지에 초점을 맞출 것입니다.

저는 먼저 DB와 Frontend 의 네트워크를 제어하기 위해서 Network Policy를 적용해두었습니다. 

아래의 결과에서는 frontend 와 db 파드간의 연결은 없을 것입니다.

*Note: 위의 그림은 서비스에 수많은 파드가 붙을 수 있다는 것을 보여주기 위해서 파드 아이콘 대신에 서비스 아이콘을 사용했습니다. 하지만 실제로 제어 규칙은 파드 단위로 적용됩니다.*

```bash
master $ kubectl exec -it frontend-8b474f47-zdqdv -- /bin/sh
$ curl backend
backend-867fd6dff-mjf92
$ curl db
curl: (7) Failed to connect to db port 80: Connection timed out
```

하지만, Backend 는 db 서비스로 문제없이 도달할 수 있습니다. 

```bash
master $ kubectl exec -it backend-867fd6dff-mjf92 -- /bin/sh
$ curl db
db-8d66ff5f7-bp6kf
```

이제 그럼 Network Policy에 대해서 들여다보죠. 

만약 `allow-db-access` 값이 `true` 로 label 이 붙어있다면, 서비스로부터 들어오는 트레픽을 허용하는 것입니다. 

```bash
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-db-access
spec:
  podSelector:
    matchLabels:
      **app: "db"**
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          **networking/allow-db-access: "true"**
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  labels:
    app: backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
        **networking/allow-db-access: "true"**
    spec:
      volumes:
      - name: workdir
        emptyDir: {}
      containers:
      - name: nginx
        image: nginx:1.14.2
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
        volumeMounts:
        - name: workdir
          mountPath: /usr/share/nginx/html
      initContainers:
      - name: install
        image: busybox
        imagePullPolicy: IfNotPresent
        command: ['sh', '-c', "echo $HOSTNAME > /work-dir/index.html"]
        volumeMounts:
        - name: workdir
          mountPath: "/work-dir"
...
```

Calico 는 Kubernetes 의 Network Policy 를 Calico 네이티브 한 포맷으로 변경합니다.

```bash
master $ calicoctl get networkPolicy --output yaml
apiVersion: projectcalico.org/v3
items:
- apiVersion: projectcalico.org/v3
  kind: NetworkPolicy
  metadata:
    creationTimestamp: "2020-11-05T05:26:27Z"
    name: knp.default.allow-db-access
    namespace: default
    resourceVersion: /53872
    uid: 1b3eb093-b1a8-4429-a77d-a9a054a6ae90
  spec:
    ingress:
    - action: Allow
      destination: {}
      source:
        selector: projectcalico.org/orchestrator == 'k8s' && networking/allow-db-access
          == 'true'
    order: 1000
    selector: projectcalico.org/orchestrator == 'k8s' && app == 'db'
    types:
    - Ingress
kind: NetworkPolicyList
metadata:
  resourceVersion: 56821/56821
```

iptables 규칙은 `filter` 테이블을 사용하여 정책을 강화하는데 중요한 역할을 합니다. 

Calico 가 강화된 개념의 `ipset` 을 사용하기 때문에 이 상황에서 리버스 엔지니어링을 하는 것은 매우 힘든 부분입니다. iptables 규칙에서 패킷이 backend 에서 출발해야만 db 파드로 들어오는 것을 허용하는 규칙을 볼 수 있습니다. 그리고 정확히 이 부분이 Network Policy가 하고 있는 부분입니다. 

calicoctl 을 사용해서 Workload 엔드포인트 디테일을 확인해보죠 

```bash
master $ calicoctl get workloadEndpoint
WORKLOAD                         NODE       NETWORKS        INTERFACE         
backend-867fd6dff-mjf92          minikube   10.88.0.27/32   cali2b1490aa46a   
db-8d66ff5f7-bp6kf               minikube   10.88.0.26/32   cali95aa86cbb2a   
frontend-8b474f47-zdqdv          minikube   10.88.0.24/32   cali505cfbeac50
```

***cali95aa86cbb2a** -* db 파드에서 사용중인 Veth 쌍 중 Host 사이드에 위치하고 있는 것 

그럼 이제 해당 인터페이스와 연관있는 iptables 규칙을 확인해봅시다! 

```bash
$ sudo iptables-save | grep cali95aa86cbb2a
:cali-fw-cali95aa86cbb2a - [0:0]
:cali-tw-cali95aa86cbb2a - [0:0]
-A cali-from-wl-dispatch -i cali95aa86cbb2a -m comment --comment "cali:R489GtivXlno-SCP" -g cali-fw-cali95aa86cbb2a
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:3XN24uu3MS3PMvfM" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:xyfc0rlfldUi6JAS" -m conntrack --ctstate INVALID -j DROP
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:wG4_76ot8e_QgXek" -j MARK --set-xmark 0x0/0x10000
-A cali-fw-cali95aa86cbb2a -p udp -m comment --comment "cali:Ze6pH1ZM5N1pe76G" -m comment --comment "Drop VXLAN encapped packets originating in pods" -m multiport --dports 4789 -j DROP
-A cali-fw-cali95aa86cbb2a -p ipencap -m comment --comment "cali:3bjax7tRUEJ2Uzew" -m comment --comment "Drop IPinIP encapped packets originating in pods" -j DROP
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:0pCFB_VsKq1qUOGl" -j cali-pro-kns.default
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:mbgUOxlInVlwb2Ie" -m comment --comment "Return if profile accepted" -m mark --mark 0x10000/0x10000 -j RETURN
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:I7GVOQegh6Wd9EMv" -j cali-pro-ksa.default.default
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:g5ViWVLiyVrKX91C" -m comment --comment "Return if profile accepted" -m mark --mark 0x10000/0x10000 -j RETURN
-A cali-fw-cali95aa86cbb2a -m comment --comment "cali:RBmQDo38EoPmxJ0I" -m comment --comment "Drop if no profiles matched" -j DROP
-A cali-to-wl-dispatch -o cali95aa86cbb2a -m comment --comment "cali:v3sEoNToLYUOg7M6" -g cali-tw-cali95aa86cbb2a
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:eCrqwxNk3cKw9Eq6" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:_krp5nzavhAu5avJ" -m conntrack --ctstate INVALID -j DROP
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:Cu-tVtfKKu413YTT" -j MARK --set-xmark 0x0/0x10000
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:leBL64hpAXM9y4nk" -m comment --comment "Start of policies" -j MARK --set-xmark 0x0/0x20000
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:pm-LK-c1ra31tRwz" -m mark --mark 0x0/0x20000 -j cali-pi-_tTE-E7yY40ogArNVgKt
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:q_zG8dAujKUIBe0Q" -m comment --comment "Return if policy accepted" -m mark --mark 0x10000/0x10000 -j RETURN
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:FUDVBYh1Yr6tVRgq" -m comment --comment "Drop if no policies passed packet" -m mark --mark 0x0/0x20000 -j DROP
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:X19Z-Pa0qidaNsMH" -j cali-pri-kns.default
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:Ljj0xNidsduxDGUb" -m comment --comment "Return if profile accepted" -m mark --mark 0x10000/0x10000 -j RETURN
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:0z9RRvvZI9Gud0Wv" -j cali-pri-ksa.default.default
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:pNCpK-SOYelSULC1" -m comment --comment "Return if profile accepted" -m mark --mark 0x10000/0x10000 -j RETURN
-A cali-tw-cali95aa86cbb2a -m comment --comment "cali:sMkvrxvxj13WlTMK" -m comment --comment "Drop if no profiles matched" -j DROP
$ sudo iptables-save -t filter | grep cali-pi-_tTE-E7yY40ogArNVgKt
:cali-pi-_tTE-E7yY40ogArNVgKt - [0:0]
-A cali-pi-_tTE-E7yY40ogArNVgKt -m comment --comment "cali:M4Und37HGrw6jUk8" -m set --match-set cali40s:LrVD8vMIGQDyv8Y7sPFB1Ge src -j MARK --set-xmark 0x10000/0x10000
-A cali-pi-_tTE-E7yY40ogArNVgKt -m comment --comment "cali:sEnlfZagUFRSPRoe" -m mark --mark 0x10000/0x10000 -j RETURN
```

`ipset` 을 확인해보면, backend pod ip 인 10.88.0.27 로부터 db pod 로 들어오는 것만 허용한다는 것이 명확히 보입니다.  

```bash
minikube $ ipset list
Name: cali40s:LrVD8vMIGQDyv8Y7sPFB1Ge
Type: hash:net
Revision: 6
Header: family inet hashsize 1024 maxelem 1048576
Size in memory: 408
References: 3
Number of entries: 1
Members:
10.88.0.27
```

## **References**

- `[https://kubernetes.io](https://kubernetes.io/)`
- `https://www.projectcalico.org/`
- `https://rancher.com/`
- `http://www.netfilter.org/`