```
1.6581143133578205e+09	INFO	Starting EventSource	{"controller": "notebook", "controllerGroup": "cosmos.cosmos", "controllerKind": "Notebook", "source": "kind source: *v1.Notebook"}
1.6581143133578784e+09	INFO	Starting EventSource	{"controller": "notebook", "controllerGroup": "cosmos.cosmos", "controllerKind": "Notebook", "source": "kind source: *v1.StatefulSet"}
1.6581143133578882e+09	INFO	Starting EventSource	{"controller": "notebook", "controllerGroup": "cosmos.cosmos", "controllerKind": "Notebook", "source": "kind source: *v1.Service"}
1.6581143133578968e+09	INFO	Starting EventSource	{"controller": "notebook", "controllerGroup": "cosmos.cosmos", "controllerKind": "Notebook", "source": "kind source: *v1.Ingress"}
1.658114313357905e+09	INFO	Starting Controller	{"controller": "notebook", "controllerGroup": "cosmos.cosmos", "controllerKind": "Notebook"}
1.6581143133578258e+09	DEBUG	events	Normal	{"object": {"kind":"Lease","namespace":"cosmos-notebook-controller","name":"872b774c.cosmos","uid":"09a8d13d-6aad-4820-a4a7-385438355208","apiVersion":"coordination.k8s.io/v1","resourceVersion":"190397502"}, "reason": "LeaderElection", "message": "cosmos-notebook-controller-manager-bf7c775b5-6fqdh_ef32bde3-38f9-4889-a51d-9f4a4ec478bd became leader"}
W0718 03:18:33.359494       1 reflector.go:324] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: failed to list *v1.Ingress: ingresses.networking.k8s.io is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "ingresses" in API group "networking.k8s.io" at the cluster scope
E0718 03:18:33.359539       1 reflector.go:138] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: Failed to watch *v1.Ingress: failed to list *v1.Ingress: ingresses.networking.k8s.io is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "ingresses" in API group "networking.k8s.io" at the cluster scope
W0718 03:18:33.359624       1 reflector.go:324] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: failed to list *v1.Service: services is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "services" in API group "" at the cluster scope
E0718 03:18:33.359694       1 reflector.go:138] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: Failed to watch *v1.Service: failed to list *v1.Service: services is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "services" in API group "" at the cluster scope
W0718 03:18:33.359878       1 reflector.go:324] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: failed to list *v1.StatefulSet: statefulsets.apps is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "statefulsets" in API group "apps" at the cluster scope
E0718 03:18:33.359904       1 reflector.go:138] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: Failed to watch *v1.StatefulSet: failed to list *v1.StatefulSet: statefulsets.apps is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "statefulsets" in API group "apps" at the cluster scope
W0718 03:18:34.457280       1 reflector.go:324] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: failed to list *v1.StatefulSet: statefulsets.apps is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "statefulsets" in API group "apps" at the cluster scope
E0718 03:18:34.457321       1 reflector.go:138] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: Failed to watch *v1.StatefulSet: failed to list *v1.StatefulSet: statefulsets.apps is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "statefulsets" in API group "apps" at the cluster scope
```

W0718 03:18:33.359494       1 reflector.go:324] pkg/mod/k8s.io/client-go@v0.24.0/tools/cache/reflector.go:167: failed to list *v1.Ingress: ingresses.networking.k8s.io is forbidden: User "system:serviceaccount:cosmos-notebook-controller:cosmos-notebook-controller-manager" cannot list resource "ingresses" in API group "networking.k8s.io" at the cluster scope

자꾸 clusterRole 추가가 안되었다고 에러가 발생함!!

role -> roleBind
해당 네임스페이스에서 serviceaccount 에다가 role 을 부여하면서 특정 리소스에 대한 api method를 사용할 수 있게해줌

ClusterRole -> CluterRoleBind 
네임스페이스 관련 없음.
그러니깐 node, pvc 같이 네임스페이스에 국한되지 않은 리소스에도 적용가능한 더 큰 범위의 role

이런식으로 role을 지정해줘야함. 오케이 그건 알겠고
근데 kubebuilder 사용하는데 어떻게 지정하냐구!!

make install 하면 
controller-gen rbac:roleName=manager-role crd
이런식으로 rbac을 gen 해준다!
https://book.kubebuilder.io/reference/controller-gen.html
여기를 참고해보면 api/ 하위를 기준으로 해서 rbac 들을 만들어주는데, 어떤식으로 내가 필요한 role 을 넣어주는지 모르겠더라


근데 알게됨!!!
https://book.kubebuilder.io/cronjob-tutorial/controller-implementation.html?highlight=+kubebuilder:rbac#implementing-a-controller
튜토리얼에 있었던 내용임.. ㅎㅎ
https://book.kubebuilder.io/reference/markers/rbac.html
controller.go 파일에 보면 
Reconcile 메서드 시작하기 전에 rbac 관련 주석들이 쫙 달려있다. 
여기서 이렇게 적어주면 controller-gen 이 알아서 rbac 파일들을 만들어줌!!! 