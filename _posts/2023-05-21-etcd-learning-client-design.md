---
layout: post
title: "[etcd] [Docs Learning] Client Design"
date: 2023-05-21
categories:
  - etcd
  - docs
tags: [
    etcd,
    docs,
    learning,
    cleint design,
    client,
    grpc,
    http,
  ]
---
> [etcd 공식 Docs](https://etcd.io/docs/v3.5/learning/) 의 Learning 문서를 보고 공부 및 해석한 내용을 기록합니다.

[Docs](https://etcd.io/docs/v3.5/learning/design-client/)

# **Introduction**

- etcd server has proven its robustness with years of failure injection testing
- Using Data store and etcd server, most complex application logic is already handled.
- **But**
- To guarantee its correctness and high availability under faulty conditions, client also need different set of intricate protocol
- ***Ideally***
    - **etcd server** provides `one logical cluster view of many physical machines`
    - **Client** implements `automatic failover between replicas`

# **Glossary**

- **clientv3**
    - etcd official Go client for etcd v3 API
- **clientv3-grpc1.0**
    - etcd v3.1 + grpc-go v1.0.X
- **clientv3-grpc1.7**
    - etcd v3.2 and v3.3 + grpc-go v1.7.X
- **cleintv3-grpc1.23**
    - etcd v3.4 + grpc-go v1.23.X
- **Balancer**
    - **etcd client load balancer** that implements **retry** and **failover** mechanism
        - etcd client should automatically balance loads between multiple endpoints
- **Endpoints**
    - A list of etcd server endpoints that clients can connect to.
        - 3 or 5 client URLs at an etcd cluster
        
        ![image](https://github.com/hhhyunwoo/hhhyunwoo.github.io/assets/37402136/201c58ff-59d2-4c6f-bb0d-9efd07642bd8)
        
- **Pinned endpoint**
    - When configured with multiple endpoints
    - `<= v3.3`
        - Client balancer chooses only one endpoint to establish a TCP connection
    - `In v3.4`
        - Balancer round-robin pinned endpoints for every request
        - distribute request more evenly
- **Client Connection**
    - **TCP connection** that has been established to an etcd server, via `gRPC Dial`
- **Sub connection**
    - gRPC SubConn interface
    - Each sub-connection contains a list of addresses.
- **Transient disconnect**
    - gRPC server returns a status code of **“Code Unavailable”**
![image](https://github.com/hhhyunwoo/hhhyunwoo.github.io/assets/37402136/03d1f8ce-440c-4f97-8418-6f62297910aa)

- **gRPC at etcd**
    - etcd provides a gRPC API for client applications to interact with the key-value store. The gRPC API enables clients to perform operations such as reading and writing key-value pairs, watching key-value updates in real-time, and performing atomic transactions.

# **Client Requirements**

- **Correctness**
    - If there is a failure from server faults, it never violates consistency guarantees.
        - never write corrupted data
    - Guarantee `consistency`!
- **Liveness**
    - Clients should make progress even if the server fails or disconnects briefly.
        - **Never deadlock for waiting server**
        - ***Ideally***
            - Client detect unavailable servers with HTTP/2 `ping` and failover to other healthy node with clear error msg
- **Effectiveness**
    - Effective with **`minimum`** resources
        - Previous TCP connection should be gracefully closed after endpoint switch
        - Failover mechanism should effectively predict the next replica to connect
- **Portability**
    - *(I’ve heard that portability is one of the cons for gRPC)*
    - Easy to connect with `other languages`
        - Error handling between difference language bindings should be consistent
        - ***“Since etcd is fully committed to gRPC, … ”***
            - ***In etcd, gRPC is the default protocol used for client-server communication.***
            - implementation should be closely aligned with gRPC long-term design goals

# **Client Overview**

- **Balancer**
    - Establishes gRPC connections to an etcd cluster
- **API Client**
    - Sends RPCs to an etcd server
- **Error Handler**
    - Decides whether to retry a failed request or switch endpoints

> Initial connection (how to encode, decode and send protocol buffer message to server, hot to handle stream RPCs..) can be different by languages, BUT **errors** returned from etcd server will be the same
> 

## **clientv3-grpc1.0**

- Overview
    - ***Multiple TCP connections are maintained*** when configured with multiple etcd endpoints
    - And pick one address and use it. The pinned address is maintained until the client object is closed.
    - When an error occurs, balancer picks another endpoint and retry.
        - Client receives an error
        - ***No error handler***
- ***Limitation***
    - Multiple TCP -> fast failover BUT more resources
    - Balancer does not understand node’s health status or cluster membership
    - > balancer can get stuck with one failed or partitioned node.

## **clientv3-grpc1.7**

- Overview
    - ***Only one TCP connection is maintained to choose etcd server.***
    - ***1. The client tries to connect to all endpoints.***
    - 2. One connection is up, balancer pins the address, closing others
    - ***When error occurred, it is sent to client error handler***
        - ***The client error handler takes an error from gRPC server, and decides whether to retry on the same endpoint, or to switch to other addresses. (based on error code and messages)***
        - Error handler decided and talk to Balancer
    - Stream RPC (watch, keepalive)
        - watch, keep-alive
            - HTTP/2.0 **keepalive** is a mechanism to keep a connection open between a client and a server to avoid the overhead of opening and closing connections for each request.
            - gRPC's **Watch** is a type of streaming RPC that allows the server to send updates to the client when the requested data changes. It is often used with no timeouts to maintain the persistent connection between the client and the server, ensuring real-time updates.
        - *Stream RPCs are typically sent with no timeouts*
        - But, clients can send periodic ***HTTP/2 pings*** to check the status of a pinned endpoint. If ping does not answer, the balancer will switch to other endpoints.
- Limitation
    - ***Unable to detect network partitions.***
        - Since partitioned gRPC server can still respond to client pings.
            - HTTP/2 keepalive is just a simple ping mechanism and can not know about cluster membership.
                - ***cluster membership***
                    - *Etcd cluster membership refers to the process by which individual nodes or members join or leave an etcd cluster. The etcd cluster membership is managed by the etcd Raft consensus algorithm, which ensures that all members in the cluster agree on the current state of the system.*
        - Balancer may get stuck with a partitioned node.
    - Balancer maintains a list of unhealthy endpoints.
        - And it hard coded as dial timeout with default value 5-second
        - So if unhealthy server returned before 5 sec, it is still unusable.
    - So tightly coupled with old gRPC interface, that every single gRPC dependency upgrade broke client behavior
    
    ## **clientv3-grpc1.23**
    
    - Overview
        - ***Simplify balancer failover logic.***
            - maintaining a list of unhealthy endpoints -> stale
            - simply ***round-robin*** to the next endpoint
                - It does not assume endpoint status. -> no more complicated status tracking is needed
            - 1) one sub-connection per each endpoint
                - If there is 5 node cluster, balancer would require 5 TCP connections ***(same with 1.1…)***
                - *More resource but provide more flexible*
        - automatically handles gRPC internal errors
    - Limitation
        - Caching the status of each endpoint
            - Not list up the node’s health status