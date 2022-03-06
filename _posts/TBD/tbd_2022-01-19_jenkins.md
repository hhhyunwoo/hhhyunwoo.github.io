젠킨스 파일에서 파이썬 가상환경 실행하기

```SH
pipeline {
    agent any
    stages {
        stage('Preparation') {
            steps{
                sh "echo 'Preparation'"
                sh "printenv"
                sh "pwd"
                sh "whoami"
                sh "ls -al"
            }
        }
        stage('Activate virtual environment') {
            steps{
                sh "source venv/seagram-cluster-controller/bin/activate"
                sh "python -V"
                sh "which python"
            }
        }
```

요런식으로 하면 가상환경 실행이 안됨

왜냐면 jenkins file에서 sh 를 실행할 때 마다 새로운 쉘을 만들기때문에
이게 무슨 뜻이냐면, bin/activate 를 sh 에서 실행하면 그 쉘 세션에서만 적용이된다는 것이다.
다음 실행하는 새로운 sh 에서는 다시 적용을 해줘야함.
