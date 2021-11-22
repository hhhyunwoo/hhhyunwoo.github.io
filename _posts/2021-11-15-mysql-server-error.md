---
layout: post
title: ERROR 2006 (HY000) MySQL server has gone away 에러 해결
date: 2021-11-15
categories:
  - jekyll
  - blog
  - github.io
  - bundler error
tags:
  [
    blog,
    jekyll,
    blog,
    jekyll theme,
    NexT theme,
    지킬 테마,
    지킬 블로그 포스팅,
    GitHub Pages,
  ]
---

- 추가사항
  ① MySQL 과 연결에 오류가 있는 경우
  ② 패킷 전송에 문제가 있는 경우
  ③ 이전 연결 세션에 영향을 받은 경우

pre_ping 설정해두면, select 1; 이런 쿼리 보내서 connection 끊기지 않게하는데,
기존 mysql의 show global variables like '%timeout%';
에서 wait_timeout 이 28800 으로 8시간이다.
이 부분에서 Pre_ping 이더라도 끊기는 듯?
그렇다고 mysql 설정을 무작정 늘리면 서버에 좋지 않기 때문에, client에서 해결하는게 좋음.
그래서 다시

```PYTHON
engine = db.create_engine(settings.DB_ENGINE_URL,
                          pool_recycle=500, pool_size=5, max_overflow=20, echo=False, echo_pool=True, )
```

으로 바꿈.
https://yongho1037.tistory.com/569

# ERROR 2006 (HY000) MySQL server has gone away 에러 해결

Flask에서 MySQL을 이용하기 위해 Sqlalchemy 를 사용하던 도중 API 호출 시

**ERROR 2006 (HY000) MySQL server has gone away**

에러가 자주 발생하였다.

구글링해서 찾아본 결과, DB서버쪽의 설정값과 Flask client에서의 문제가 있을 수 있다.

## MySQL 서버 설정하기

max_allowed_packet 값을 변경해주는 것인데,

max_allowed_packet 는 서버로 질의하거나 받게되는 패킷의 최대 길이를 나타내는 변수 값이다.

즉, client와 통신할 때 핸들링 할 수 있는 데이터 양을 의미한다.

```shell
$ SET GLOBAL max_allowed_packet=64*1024*1024;
```

이 컨맨드로 64MB로 max값을 수정했다.

영구적으로 수정하려면 myslq의 conf에서 설정을 변경해주어야한다. (my.ini 파일)

### Client Sqlalchemy에서 설정 값 부여하기

```python
engine = db.create_engine("mysql+pymysql://root:PASSWORD@IP:3306/DBNAME", pool_pre_ping=True)
```

engine을 선언할 때 pool_pre_ping 옵션 값에 True를 부여한다.
pool_pre_ping 옵션은 Disconnect handling을 해결하는 옵션인데, DB서버 접속 전 "select 1" 과 같은 쿼리문을 ping으로 날려서 connection을 확인하고 연결을 진행한다.

---

_참고 : https://tjddnjs.tistory.com/69, https://blog.dork94.com/195_
