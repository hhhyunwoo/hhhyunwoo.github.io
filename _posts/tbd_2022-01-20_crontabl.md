crontab 을

첫번째 이슈
permission denied

실행도 안되길래 로그도 안찍힘..
-> 45 \* \* \* \* /var/www/cron/naver_blog_cron.sh >> /var/www/log/naver_blog_cron.log 2>&1

출처: https://blog.work6.kr/321 [워크식스 커뮤니티]
요런식으로 로그 찍어서 permission denied 확인함

근데도 안됨.
kubectl not found 뜸

이게 왜냐면

sqlplus 를 실행 하기 위한 환경변수가 없어 생기는 문제인듯 합니다.
sqlplus 등 oracle 관련 스크립트가 돌아가려면
ORACLE_HOME
ORACLE_BASE
등 여러가지 환경 변수가 필요하고, 또 어떨때는 oracle user 여야만 돌아갈수도......

bash 를 쓰신다면 .bash_profile 등에 있는 oracle 환경 변수 선언 부분을 참조하시어 script 다시 짜보시는게 나을듯 합니다.

아.. 그리고 한가지 script 확인 방법을 말씀 드리자면, cron 돌릴때 login 한 상태에서 script 돌리면 모든 환경변수들 다 가지고 가기 때문에 당연히 돌아갑니다.
cron 은 cron 으로 확인 하시던지, 아니면 at 을 이용하여확인 하시는게 cron 걸어놓고, 안돌아가서 후회화는 일이 없는 .......

https://kldp.org/node/59859

요런 이유이다..

not found 이유!!!

crontab의 기본 PATH는 /usr/bin 밖에 없습니다.
즉, /usr/local/bin 등 다른 경로에 있는 command에 대해서는 crontab 이 인식하지 못하는데요.

해결책은 아래처럼 crontab에 직접 PATH를 등록 하는 것입니다.

```SH
PATH=/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin
LD_LIBRARY_PATH=/usr/local/lib

* * * * * my_command.sh some_args
```

-> command not found 해결

crontab -> shell -> python 실행인데 파이썬의 로그가 안찍힌다...?
crontab 에서 하니깐 경로가 꼬였나보다.

그래서 그냥
_/30 _ \* \* \* /home/deploy/hans/userlm-monitoring/start*pod_health_check.sh >> /home/deploy/hans/userlm-monitoring/logs/cron*$(date +\%Y\%m\%d\%H\%M\%S).log 2>&1
요런식으로 직접 날짜를 넣어서 로그를 찍어주었다.
날짜 찍는법 -> $(date +\%Y\%m\%d\%H\%M\%S)
