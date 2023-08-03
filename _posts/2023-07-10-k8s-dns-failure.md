---
layout: post
title: "[K8S] Node 에서 Domain Resolving(nslookup) 실패 이슈"
date: 2023-07-10
categories:
  - Kubernetes
tags: [
    k8s,
    domain,
    nslookup,
  ]
---
## Description

- systemd-resolved.service 를 켰을 때 아래와 같이 nslookup이 안되는 경우가 있음

```bash
test-app2:~$ nslookup google.com
Server:        127.0.0.53
Address:    127.0.0.53#53
 
** server can't find google.com: SERVFAIL
 
test-app2:~$ cat /etc/resolv.conf
nameserver 127.0.0.53
options         timeout:1 attempts:2 rotate
```

## Cause

- systemd-resolved.service를 새로 킬 때 서버 이름으로 dns resolving 파일을 새로 만들어준다.
    - 이 때 **dns 서버 주소가 잘못 설정되어 있어서 설정이 잘못 들어간 것**

## Solution

1. 먼저 `systemd-resolved.service` 를 **stop** 해준다.
2. `/etc/resolv.conf` 파일에 사내 DNS 주소를 넣어준다. 
    - (ref. https://askubuntu.com/questions/1370794/systemd-resolved-not-resolving-any-domains)
3. 다시 `systemd-resolved.service` **start** 한다.

```bash
test-app1:~$ sudo systemctl stop systemd-resolved.service
test-app1:~$ sudo vi /etc/resolv.conf
# This file is managed by man:systemd-resolved(8). Do not edit.
#
# This is a dynamic resolv.conf file for connecting local clients directly to
# all known uplink DNS servers. This file lists all configured search domains.
#
# Third party programs must not access this file directly, but only through the
# symlink at /etc/resolv.conf. To manage man:resolv.conf(5) in a different way,
# replace this symlink by a static file or a different symlink.
#
# See man:systemd-resolved.service(8) for details about the supported modes of
# operation for /etc/resolv.conf.
 
nameserver X.X.X.X
 
 
test-app2:~$ sudo systemctl start systemd-resolved.service
test-app1:~$ nslookup google.com
Server:     X.X.X.X
Address:    X.X.X.X
 
Non-authoritative answer:
Name:   google.com
Address: 216.58.195.142
Name:   google.com
Address: 2607:f8b0:4002:c09::64
Name:   google.com
Address: 2607:f8b0:4002:c09::66
Name:   google.com
Address: 2607:f8b0:4002:c09::71
Name:   google.com
Address: 2607:f8b0:4002:c09::65
```