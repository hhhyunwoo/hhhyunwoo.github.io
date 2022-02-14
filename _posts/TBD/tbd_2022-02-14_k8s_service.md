Kubernetes Service

# ClusterIP

말 그대로 클러스터 내부에서 사용하는 IP
클러스터 내부의 노드나 파드에서는 ClusterIP를 이용해서 서비스에 연결된 각 파드들에 접근한다.
하지만 외부에서는 이 IP로 접근 불가능

```yaml
apiVersion: v1
kind: Service
metadata:
  name: test
spec:
  ports:
    - port: 8080
      protocol: TCP
      targetPort: 8080
  selector:
    app: test
```

port -> targetport

# NodePort

클러스터 내부외 외부 모두 접근이 가능하다.
Nodeport는 클러스터의 모든 노드에 특정 포트를 열어두고 어떤 노드에 접근하든지 모두 다 포트 포워딩을 해준다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: test
spec:
  selector:
    app: test
  type: NodePort
  ports:
    - name: 30088-5000
      nodePort: 30088 # 서비스가 클러스터 외부로 노출하는 포트
      protocol: TCP
      port: 30001 # 서비스가 클러스터 내부로 오픈하는 포트
      targetPort: 5000 # 타겟 파드에 요청을 보내는 포트
```

즉, 외부에서 30088로 접근하면 30001로 포트포워딩 되고 다시 5000번으로 포트 포워딩 됨.
![image](https://github.kakaoenterprise.in/storage/user/1003/files/df1bf0b4-694b-4385-9485-7309f26d5e73)

# Loadbalancer

Nodeport + ClusterIP 라고 보면 될 것 같다.

```yaml
kind: Service
apiVersion: v1
metadata:
  name: test
  annotations:
    service.beta.kubernetes.io/openstack-internal-load-balancer: "true"
spec:
  selector:
    app: test
  type: LoadBalancer
  ports:
    - name: http1
      port: 30080
      targetPort: 5000
    - name: http2
      port: 30081
      targetPort: 5000
    - name: http3
      port: 30082
      targetPort: 5000
```

```
service/test   LoadBalancer   <CLUSTER-ip>    <external-ip>   30080:30352/TCP,30081:31824/TCP,30082:31996/TCP   43m
```

```
Name:                     default-test
Namespace:                default
Labels:                   <none>
Annotations:              service.beta.kubernetes.io/openstack-internal-load-balancer: true
Selector:                 app=test
Type:                     LoadBalancer

Port:                     http1  30080/TCP
TargetPort:               5000/TCP
NodePort:                 http1  30352/TCP

Port:                     http2  30081/TCP
TargetPort:               5000/TCP
NodePort:                 http2  31824/TCP

Port:                     http3  30082/TCP
TargetPort:               5000/TCP
NodePort:                 http3  31996/TCP

Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

get svc 를 하게 되면 Loadbalancer의 External IP와 Ports가 나오게된다.
근데 yaml에서 30352 포트를 사용한적이 없는데 Ports에서 30080:30352 라고 나온다.

이게 무엇인고 하니, LoadBalancer를 만들게 되면 자동으로 Nodeport가 생성이 되나보다.

describe 해서 나온 값들을 보면
Port: http1 30080/TCP
TargetPort: 5000/TCP
NodePort: http1 30352/TCP
요렇게 되어있다.

즉, 30080 -> 30352 -> 5000 이렇게 리다이렉팅이 된다는 의미이다!

참고 : https://nearhome.tistory.com/95 , https://ooeunz.tistory.com/123
