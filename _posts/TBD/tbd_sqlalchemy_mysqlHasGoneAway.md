---
layout: post
title: title
date: 2021-11-13
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

pool_size=20, pool_recycle=3600, pool_pre_ping=True
요런 옵션 추가해도 8시간 정도 지나면 자꾸 timeout 뜸...
확실한 이유를 모르겠다.

exception sqlalchemy.exc.DisconnectionError(\*arg, \*\*kw)
A disconnect is detected on a raw DB-API connection.

This error is raised and consumed internally by a connection pool. It can be raised by the PoolEvents.checkout() event so that the host pool forces a retry; the exception will be caught three times in a row before the pool gives up and raises InvalidRequestError regarding the connection attempt.

즉, 3번 retry했는데도 안되면 InvalidRequestError 를 던진다.

```py
from sqlalchemy import create_engine, event
from sqlalchemy.exc import DisconnectionError


def checkout_listener(dbapi_con, con_record, con_proxy):
    try:
        try:
            dbapi_con.ping(False)
        except TypeError:
            dbapi_con.ping()
    except dbapi_con.OperationalError as exc:
        if exc.args[0] in (2006, 2013, 2014, 2045, 2055):
            raise DisconnectionError()
        else:
            raise


db_engine = create_engine(DATABASE_CONNECTION_INFO,
                          pool_size=100,
                          pool_recycle=3600)
event.listen(db_engine, 'checkout', checkout_listener)
```

The listen() function is part of the primary interface for the SQLAlchemy event system, documented at Events.

```py
from sqlalchemy import event
from sqlalchemy.schema import UniqueConstraint

def unique_constraint_name(const, table):
    const.name = "uq_%s_%s" % (
        table.name,
        list(const.columns)[0].name
    )
event.listen(
        UniqueConstraint,
        "after_parent_attach",
        unique_constraint_name)
```

```sh
function sqlalchemy.event.listen(target, identifier, fn, *args, **kw)
```

-> Register a listener function for the given target.

_참고_

- https://stackoverflow.com/questions/18054224/python-sqlalchemy-mysql-server-has-gone-away
- https://discorporate.us/jek/talks/SQLAlchemy-EuroPython2010.pdf

# title

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
