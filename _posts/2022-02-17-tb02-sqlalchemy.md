---
layout: post
title: "[SQLalchemy] NULL 조회 "
date: 2022-02-17
categories:
  - SQLalchemy
  - Trouble Shooting
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

# SQLalchemy에서의 NULL 조회

```python
cluster_item = self.db.query(Cluster)\
 .filter((Cluster.userid.is_(None)) & (Cluster.domain.is_(None)))\
 .order_by(Cluster.id).first()
```

위와 같이 `NULL`을 조회했었는데, 정상적으로 조회가 되지 않았다.

살펴보니 방법이 달랐다.

`NULL` 조회시

```python
userid is None
```

으로 하면 안된다.

```python
userid == None
# OR
userid.is_(None)
```

이렇게 해야한다.

## 두개 이상 키의 NULL을 찾고 싶을 때

```python
userid.is_(None) and domain.is_(None)
```

`and`로 묶으면 안된다.

```python
.filter((Cluster.userid.is_(None)) & (Cluster.domain.is_(None)))
이런식으로 구분해줘야 한다.
```

_참고 : https://veluxer62.github.io/explanation/sqlalchemy-filter-is-null/_
