aware time 과 unaware time

aware 객체는 시간 존을 가지고 있는 것이다.

참고 : https://8percent.github.io/2017-05-31/django-timezone-problem/

```py
Date time 정리
unaware, aware
>>> from django.utils.timezone import is_aware, is_naive, make_naive, make_aware
>>> import datetime
>>> import pytz
>>>
>>> unaware = datetime.datetime(2011, 8, 15, 8, 15, 12, 0)
>>> aware = datetime.datetime(2011, 8, 15, 8, 15, 12, 0, pytz.UTC)
>>>
>>>
>>> unaware, aware
(datetime.datetime(2011, 8, 15, 8, 15, 12), datetime.datetime(2011, 8, 15, 8, 15, 12, tzinfo=<UTC>))
>>>
>>> is_naive(unaware), is_naive(aware)
(True, False)
>>> is_aware(unaware), is_aware(aware)
(False, True)
>>>
>>> make_aware(aware, pytz.UTC)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/lib/python3.9/site-packages/django/utils/timezone.py", line 270, in make_aware
    return timezone.localize(value, is_dst=is_dst)
  File "/usr/local/lib/python3.9/site-packages/pytz/__init__.py", line 238, in localize
    raise ValueError('Not naive datetime (tzinfo is already set)')
ValueError: Not naive datetime (tzinfo is already set)
>>> make_aware(unaware, pytz.UTC)
datetime.datetime(2011, 8, 15, 8, 15, 12, tzinfo=<UTC>)
>>> unaware
datetime.datetime(2011, 8, 15, 8, 15, 12)
>>>
>>>
>>> make_naive(unaware, pytz.UTC)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/lib/python3.9/site-packages/django/utils/timezone.py", line 286, in make_naive
    raise ValueError("make_naive() cannot be applied to a naive datetime")
ValueError: make_naive() cannot be applied to a naive datetime
>>> make_naive(aware, pytz.UTC)
datetime.datetime(2011, 8, 15, 8, 15, 12)
>>> aware
datetime.datetime(2011, 8, 15, 8, 15, 12, tzinfo=<UTC>)
```
