---
layout: post
title: "[Python] Fastapi 에서의 get_db = Depends()란?"
date: 2021-11-13
categories:
  - Python
tags:
  [
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

```py
def dss_deploy_loadbalancer(cluster: SpeechServer, db: get_db = Depends()):
    ABC
```

Depends()는 무슨의미일까

_참고 : https://victoria-k.tistory.com/entry/5-Dependency-Injection%EC%9D%B4%EB%9E%80-in-Fast-API_

# Fastapi 에서의 get_db = Depends()란?

FastAPI를 사용하면서 DB접근을 했다면 db: get_db = Depends() 를 사용해본 경험이 있을 것이다.

```py
def predict(cluster: test, db: get_db = Depends()):
    return
```

## subTitle 1

a

### subsubtitle1

- a
- a

-> a

### subsubtitle2

- a
- a

-> a

---

## subTitle 2

a

### subsubtitle1

- a
- a

-> a

### subsubtitle2

- a
- a

-> a
