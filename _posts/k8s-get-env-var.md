k8s yaml 명세에서는 env를 읽어와서 varible 로 사용할 수 있음

자세한 것은 https://kubernetes.io/ko/docs/tasks/inject-data-application/_print/ 여기 참고하면 됨


간단하게 말하자면 
```yaml
env:
- name: MESSAGE
  value: "hello world"
command: ["/bin/echo"]
args: ["$(MESSAGE)"]
```
이런식으로 env를 설정하면 $() 를 사용해서 불러와서 변수처럼 사용할 수 있음

또한 Downward API를 사용해서 env 값에다가 다른 env값도 ref할 수 있음
https://kubernetes.io/ko/docs/tasks/inject-data-application/_print/#%EB%8B%A4%EC%9A%B4%EC%9B%8C%EB%93%9C-api%EC%9D%98-%EA%B8%B0%EB%8A%A5
```yaml
spec:
  containers:
  - name: envars-test-container
    image: nginx
     env:
      - name: MY_NODE_NAME
        valueFrom:
        fieldRef:
            fieldPath: spec.nodeName
```
근데 읽어올 수 있는 것들이 한정적임

metadata.name
metadata.namespace
metadata.uid
metadata.labels['<KEY>'] 
metadata.annotations['<KEY>'] 
status.podIP - 파드의 IP 주소
spec.serviceAccountName - 파드의 서비스 계정 이름
spec.nodeName - 스케줄러가 항상 파드를 스케줄링하려고 시도할 노드의 이름
status.hostIP - 파드가 할당될 노드의 IP 주소
resource도 읽어올 수 있음



그래서 나는 env를 불러와서 command안에서 사용하려고 무지하게 노력했는데 못읽어와짐
아래가 나의 코드! 

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: my-notebook-test
  namespace: test
  labels:
    jupyter-token: "test"
  annotations:
    test: "test"
    jupyter-token: "test"
spec:
  replicas: 1
  selector:
    matchLabels:
      statefulset: my-notebook
  serviceName: ""
  template:
    metadata:
    spec:
      containers:
        - command:
            - /bin/bash
            - -c
            - |
              start.sh jupyter lab \
              --ServerApp.token="$(JUPYTER_TOKEN)" \
              --ServerApp.password='' \
              --ServerApp.ip='0.0.0.0' \
              --ServerApp.allow_root=True
          env:
            - name: JUPYTER_TOKEN
              valueFrom:
                fieldRef:
                  fieldPath: metadata.annotations['jupyter-token']
          image: nginx
          name: my-notebook
          ports:
            - containerPort: 8888
              protocol: TCP
```

이렇게 아무리 읽으려고 해도 안됨


원인 파악 완료!! 
https://stackoverflow.com/questions/71137291/kubernetes-annotations-are-not-applied

그니깐 .metadata 와 .spec.template.metadata의 적용 범위가 다르다!!
지금 나의 명세는 statefulset인데, .metadata는 statefulset에 대해서 적용되는 것이고 
.spec.template.metadata 요거는 statefulset으로 인해서 생성되는 pod에 적용되는 값임.

그니깐 내가 command를 실행하는 곳이 생성되는 각각 pod이기 때문에 metadata를 못읽어오는 것이다!!!

```yaml
spec:
  template:
    metadata:
      annotations:
        test: "test"
        jupyter-token: "test"
      labels:
        test: "test"
        jupyter-token: "test"
```

이 코드를 추가해주면 일겅올 수 있음!! 