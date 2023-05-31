---
layout: post
title: "[번역] Kubernetes: Flannel Networking"
date: 2023-05-31
categories:
  - Kubernetes
tags:
  [
    kubernetes,
    packet,
    network,
    translation,
    cni,
    flannel.
    vxlan,
    udp
  ]
---
> [**해당 Posting**](https://dramasamy.medium.com/life-of-a-packet-in-kubernetes-part-3-dd881476da0f) 을 공부하며 번역하는 글입니다.
> 

해당 포스팅은 쿠버네티스 환경에서 **flannel 네트워크**가 어떻게 동작하는지를 설명하는 글입니다.

쿠버네티스는 규모에 맞게 컨테이너화 된 애플리케이션을 관리하는데 굉장히 유용한 도구입니다. 하지만 여러분도 아시다시피, 쿠버네티스를 학습하는 것은 쉽지만은 않습니다. 특히 **네트워크 구현의 백앤드쪽**은 더 어렵습니다. 

네트워킹 쪽에서 많은 이슈들을 마주했었고, 트러블 슈팅에 많은 시간을 소요했습니다.

이번 포스팅에서, 최대한 간단한 예시로 구현체에 대해서 설명할 것입니다. 이를 통해 쿠버네티스 네트워크가 어떻게 동작하는지 설명하겠습니다. 이 포스팅이 쿠버네티스를 공부하는 사람들에게 많은 도움이 되었으면 좋겠습니다.

# Kubernetes networking model

아래의 도표는 간단한 **쿠버네티스 클러스터**를 보여줍니다. 

<img width="915" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/81ad36ac-1603-4ac9-8ef0-bbba2d07a3d9">

쿠버네티스는 리눅스 머신*(AWS EC2와 같은 VM 이 될 수도 있고, 물리 머신이 될 수도 있습니다)* 을 관리하고, 각각의 host 머신에서 쿠버네티스는 수 많은 파드들을 실행합니다. 또한 각각의 파드는 여러 컨테이너를 가지고 있을 수 있습니다. 유저 애플리케이션은 여러 컨테이너들 중 하나의 내부에서 돌아가고 있습니다.

쿠버네티스에서 파드는 최소 단위이고, 파드 내부에 위치한 모든 컨테이너는 같은 `네트워크 네임스페이스`를 공유합니다. 즉, 모든 컨테이너는 같은 네트워크 인터페이스를 가지고 있고 `localhost` 를 사용하여 각각이 연결될 수 있다는 것을 의미합니다.

[공식문서](https://kubernetes.io/docs/concepts/cluster-administration/networking/?source=post_page---------------------------)에서는 쿠버네티스 네트워크 모델은 아래의 요소들을 필요로 한다고 이야기하고 있습니다.

- 모든 **컨테이너**는 모든 **다른 컨테이너**와 **NAT 없이 통신이 가능**하다.
- 모든 **노드**는 모든 **컨테이너**와 **NAT 없이 통신이 가능**하다. (역도 가능)
- **컨테이너**가 **자신의 IP 를 확인했을 때 나오는 값**과 **외부에서 바라보는 IP는 동일**하다.

우리는 위의 내용에서 나오는 `컨테이너`를 `파드`로 바꿔서 볼 수 있습니다. 즉, 모든 **컨테이너**는 **파드 네트워크**를 공유합니다. 

기본적으로 모든 파드는 클러스터 내부의 모든 다른 파드들과 자유롭게 통신할 수 있다는 것을 의미하는데요, 심지어 다른 Host 일 경우도 가능합니다. 

그리고 이들은 Host 가 존재하지 않는 것처럼 자신들의 IP 주소를 가지고 인식을 합니다. 또한 Host 는 어떠한 주소 변환 (DNAT, SNAT) 없이 자신의 IP 주소로 어떤 파드든 연결이 가능합니다. 

# The Overlay Network

`Flannel` 은 쿠버네티스 네트워크를 위하여 CoreOS에 의해 개발되었는데요, 쿠버네티스 뿐만 아니라 다른 목적의 일반적인 네트워크 솔루션으로 사용되기도 합니다. 

쿠버네티스 네트워크 요구사항을 만족하기 위한 Flannel 의 컨셉은 단순합니다. 

***“Host 네트워크 위에서 작동하는 Overlay 네트워크라고 불리는 Flat 한 다른 네트워크를 만든다.”***

모든 컨테이너들 (파드) 은 오버레이 네트워크에서 각자 하나의 IP 주소를 할당받을 것이고, 서로의 Ip 주소를 직접 찌르면서 통신할 것입니다.

설명에 대한 이해를 돕기 위해서, AWS 위에서 작은 쿠버네티스 클러스터를 올려봤습니다. 클러스터에는 3개의 노드가 존재하고 네트워크 구조는 아래와 같습니다.

<img width="1268" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/315229f3-1366-4bdb-b231-bb24781c9c3b">

이 클러스터에는 3가지 네트워크가 존재합니다.

### AWS VPC Network

모든 인스턴스는 하나의 **VPC 서브넷** (`172.20.32.0/19`) 에 위치합니다. 인스턴스들은 이 범위 안에서 IP 주소를 할당받는데요, 모든 호스트는 같은 LAN에 있기 때문에 서로 연결이 가능합니다.

### Flannel Overlay Network

Flannel 은 2¹⁶(65536) 개의 주소를 가질 수 있는 **더 큰 네트워크**(`100.96.0.0/16`)를 만듭니다. 그리고 이 네트워크는 모든 쿠버네티스 노드들에 걸쳐있고, 각각의 파드들은 이 범위에서 하나의 IP 주소를 할당받을 것입니다. 

이후에는 어떻게 Flannel 이 이와 같은 네트워크를 얻을 수 있는지 확인해보겠습니다.

### In-Host Docker Network

Host 내부에서 Flannel은 해당 호스트에 있는 모든 파드들에게 `100.96.x.0/24` 네트워크를 할당합니다. 

같은 호스트 내부에 위치한 컨테이너들은 `docker0` 라는 **Docker bridge**를 이용하여 서로 통신이 가능한데요, 이는 간단하기 때문에 이번 아티클에서는 생략하겠습니다. 

오버레이 네트워크에서 다른 호스트들에 위치한 컨테이너들끼리 통신하기 위해서, Flannel 은 `커널 라우트 테이블`과 **`UDP 캡슐화`**를 사용합니다. 아래의 내용은 이를 설명하기 위한 부분입니다! 

# Cross host container communication

노드 1번에 위치한 `100.96.1.2` IP 주소를 가진 컨테이너*(컨테이너-1 이라고 부르자)* 가 노드 2번에 위치한 `100.96.2.3` IP 주소를 가진 컨테이너(*컨테이너-2 라고 부르자*) 와 연결을 하고 싶다고 가정해보겠습니다.

그럼 오버레이 네트워크가 어떻게 패킷이 통과 가능하도록 하는지 살펴보겠습니다! 

<img width="1197" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/528c9768-5afe-4a81-880f-c543db43614b">

***Host 들 간의 연결*** 

먼저 컨테이너-1 은 `src: 100.96.1.2 -> dst: 100.96.2.3` 를 가진 IP 패킷을 하나 만듭니다. 패킷은 컨테이너의 게이트웨이인 **docker0** 브릿지로 이동할 것입니다. 

각각의 호스트에서, flannel 은 `flanneld` 라고 불리는 데몬 프로세스를 실행하는데요, 이는 커널의 라우트 테이블에 라우트 규칙을 생성합니다.

아래는 노드 1번의 라우트 테이블입니다. 

```bash
admin@ip-172-20-33-102:~$ ip route
default via 172.20.32.1 dev eth0
100.96.0.0/16 dev flannel0  proto kernel  scope link  src 100.96.1.0
100.96.1.0/24 dev docker0  proto kernel  scope link  src 100.96.1.1
172.20.32.0/19 dev eth0  proto kernel  scope link  src 172.20.33.102
```

위에서 볼 수 있듯이, 패킷의 목적지 주소 `100.96.2.3` 는 더 큰 네트워크인 오버레이 네트워크 `100.96.0.0/16` 에 속합니다. 따라서 이는 두번째 규칙에 부합합니다. 이제 커널은 이 패킷을 `flannel0` 으로 보내야 한다는 것을 알게됩니다. 

> Note: ip route 명령어와 iptables 명령어는 뭐가 다를까? 
> ip route : 네트워크 경로 설정과 관련된 작업을 수행. IP 패킷의 경로를 결정하는 라우팅 테이블을 관리할 수 있음 
>
> iptables : Linux에서 방화벽 기능을 제공하는 도구. 네트워크 트래픽을 필터링하고, 허용 또는 거부하는 규칙을 설정할 수 있음
> 

`flannel0` 은 또한 우리 `flanneld` 데몬 프로세스에 의해서 만들어진 **TUN 디바이스**이고 (`*TUN` 은 리눅스 커널에서 구현된 소프트웨어 인터페이스를 뜻합니다*), raw IP 패킷을 유저 프로그램과 커널 사이에서 패스할 수 있습니다. 

이는 두 가지 방법으로 작동됩니다. 

- IP 패킷을`flannel0` 디바이스에 쓸 때, 패킷은 커널로 직접 보내지고 커널은 라우트 테이블에 따라서 패킷을 라우팅할 것입니다.
- IP 패킷이 커널에 도착하면 라우트 테이블은 이 패킷이 `flannel0` 디바이스로 가야한다고 말할 것입니다. 그리고 커널은 이 장치를 생성한 프로세스 즉, `flanneld` 데몬 프로세스로 패킷을 보내줄 것입니다.


<br>
커널이 TUN 장치로 패킷을 보낼 때 이는 곧 바로 `flanneld` 프로세스로 이동하고, 목적지 주소가 `100.96.2.3` 인것을 확인합니다. 도표에서는 이 주소가 노드 2번에서 돌아가는 컨테이너에 속해있다는 것을 알 수 있지만, `flanned` 는 이것을 어떻게 알까요?
<br>
flannel이 몇 가지 정보를 etcd 라고 불리는 키-값 저장소에 저장을 하고있기 때문에 가능한 일입니다. 

만약 여러분이 쿠버네티스에 대해서 어느정도 아신다면 그렇게 놀랄일은 아닐 겁니다. 

flannel 의 경우에는 etcd를 단순 키-값 저장소로 생각할 수 있습니다. 
<br>
flannel 은 서브넷과 호스트 간 매핑 정보를 etcd 서비스에 저장합니다. `etcdctl` 커맨드로 확인할 수도 있습니다!

```bash
admin@ip-172-20-33-102:~$ etcdctl ls /coreos.com/network/subnets
/coreos.com/network/subnets/100.96.1.0-24
/coreos.com/network/subnets/100.96.2.0-24
/coreos.com/network/subnets/100.96.3.0-24

admin@ip-172-20-33-102:~$ etcdctl get /coreos.com/network/subnets/100.96.2.0-24
{"PublicIP":"172.20.54.98"}
```

그러니깐, 각각의 `flanneld` 프로세스는 etcd에 쿼리를 날려 각각의 서브넷이 어떤 호스트에 속해있는지 알 수 있고, 목적지 IP를 etcd 에 저장된 모든 서브넷과 비교할 수 있습니다. 

우리의 경우에는 `100.96.2.3` 이라는 주소가 `100.96.2.0-24` 라는 서브넷과 매칭됩니다. 그리고 해당 키에 저장된 값을 확인해보면 Node IP가 `172.20.54.98` 이라는 것을 알 수 있습니다! 
<br>
이제 flanneld 는 목적지 주소를 알고 있습니다. 또한 자신의 호스트 IP를 출발지 주소로 하고 타겟 호스트의 IP를 목적지로 하여 원본 IP 패킷을 UDP 패킷으로 캡슐화하였습니다. 

각각의 호스트에서 `flanneld` 프로세스는 디폴트 UDP 포트 `:8285` 를 리슨하고 있을 것입니다. 

이제 UDP 패킷의 목적지 포트를 `8285` 로만 설정해주고 유선으로 전송만 하면 됩니다! 
<br>
UDP 패킷이 목적지 호스트에 도착한 뒤에, 커널의 IP 스택은 패킷을 `flanneld` 프로세스로 보낼 것입니다. 왜냐하면 flanneld 가 UDP Port 인 `8285` 를 리슨하고 있는 유저 프로세스이기 때문입니다. 

그럼 `flanneld` 는 원본 컨테이너로부터 생성된 원본 IP이 담겨있는 패킷인 UDP 패킷의 payload 를 받을 것이고, 간단하게 이 패킷을 TUN 장치인 `flanneld0` 에 작성할 것입니다. 그러면 이 패킷은 커널로 바로 보내지는데, 이것이 TUN 이 장동하는 방법입니다. 
<br>
노드 1번과 동일하게, 라우트 테이블은 이 패킷이 어디로 가야할지 결정할 것입니다. 

노드 2번의 라우트 테이블을 살펴보죠! 

```bash
admin@ip-172-20-54-98:~$ ip route
default via 172.20.32.1 dev eth0
100.96.0.0/16 dev flannel0  proto kernel  scope link  src 100.96.2.0
100.96.2.0/24 dev docker0  proto kernel  scope link  src 100.96.2.1
172.20.32.0/19 dev eth0  proto kernel  scope link  src 172.20.54.98
```

IP 패킷의 목적지 IP 주소는 100.96.2.3 이었습니다. 

커널은 가장 근접하게 일치하는 규칙을 적용할 것인데, 3번째가 바로 그것입니다. 패킷은 docker0 장치로 보내질 것입니다. 

docker0 는 브릿지 장치이고, 해당 장비에 있는 모든 컨테이너들은 이 브릿지를 통해서 연결되어 있기 때문에 패킷은 결국 보내질 것이고 목적지인 컨테이너-2 에서 받을 수 있을 것입니다. 
<br>
마침내 우리 패킷은 목적지로 가는 여정을 마쳤습니다. 컨테이너-2 가 컨테이너-1로 패킷을 다시 보낸다면 역방향의 라우팅이 정확히 동일하게 진행될 것 입니다. 

이것이 host 컨테이너가 통신하는 방법입니다!
<br>
# Configuring with docker network

위의 설명에서 우리는 한 가지 포인트를 놓쳤습니다. 

`100.96.x.0/24` 와 같이 조금 더 작은 서브넷을 사용하려면 도커를 어떻게 설정해야할까요? 

`flanneld` 가 서브넷 정보를 호스트에 위치한 파일에 작성하는데, 이를 통해 가능합니다.

```bash
admin@ip-172-20-33-102:~$ cat /run/flannel/subnet.env
FLANNEL_NETWORK=100.96.0.0/16
FLANNEL_SUBNET=100.96.1.1/24
FLANNEL_MTU=8973
FLANNEL_IPMASQ=true
```

이 정보는 도커 데몬의 옵션을 구성할때 사용됩니다. 따라서 도커는 `FLANNEL_SUBNET` 을 브릿지 네트워크로 사용할 수 있고, 이를 통해 in-host 컨테이너 네트워크는 동작합니다.

```bash
dockerd --bip=$FLANNEL_SUBNET --mtu=$FLANNEL_MTU 
```

# Packet copy and Performance

새로운 버전의 `flannel` 은 **운영 단계에서 UDP 캡슐화를 추천하지 않으며**, 디버깅과 테스트 목적으로만 사용되어야 한다고 이야기합니다. **그 이유는 성능때문입니다.**

`flannel0` TUN 장치는 커널을 통해 패킷을 얻거나 보낼 때 간단한 방법을 사용하지만, 이는 성능적인 패널티가 존재합니다. **패킷이 user space와 kernel space 앞 뒤로 복사가 되어야만 한다는 것**입니다.

<img width="1071" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/59a06c9c-6f70-4154-bb95-ccc1f3a78ded">

위에서 볼 수 있듯이, 원본 컨테이너 프로세스가 패킷을 보내면 패킷은 User space와 Kernel space 사이에서 3번의 복사가 일어나야 합니다. 이는 네트워크 오버헤드를 상당히 증가시키기 때문에 운영 단계에서는 될 수 있으면 UDP 사용을 피해야합니다. 

# Conclusion

Flannel 은 쿠버네티스 네트워크 모델 구현체 중 가장 간단한 것들 중 하나입니다. flannel 은 이미 존재하는 docker 브릿지 네트워크와 UDP 캡슐화를 위해 데몬 프로세스를 이용한 추가적인 TUN 장치를 사용합니다. 

이 글에서는 주요한 부분의 디테일만 설명드렸습니다: host 컨테이너 간의 통신과 성능 저하에 대한 간단한 언급 정도. 

쿠버네티스 네트워크의 기본에 대해 이해하는데 이 글이 많은 도움이 되었으면 좋겠습니다. 이러한 지식을 바탕으로 여러분은 더 흥미진진한 쿠버네티스 네트워크를 탐험할 수 있을 것입니다. 또한 [Calico](https://www.projectcalico.org/?source=post_page---------------------------), [WeaveNet,](https://www.weave.works/oss/net/?source=post_page---------------------------) [Romana](https://romana.io/?source=post_page---------------------------) 와 같은 더 고도화된 구현체를 이해할 수 있을 것입니다! 

# Reference

- https://ssup2.github.io/theory_analysis/Kubernetes_Flannel_Plugin/

### 전체적인 그림을 위해서 추가적인 내용

<img width="920" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/e351853b-0640-44a0-9183-1ef739169453">

<img width="955" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/667a917f-7bec-49e8-a00a-9ace82985abc">

- ref. https://ssup2.github.io/theory_analysis/Kubernetes_Flannel_Plugin/