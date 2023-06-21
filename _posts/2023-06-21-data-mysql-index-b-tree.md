---
layout: post
title: "[Data Structure] MySQL Index 자료구조 B-tree"
date: 2023-06-21
categories:
  - Data Structure
tags: [
    data structure,
    b-tree,
    index,
    hashtable,
  ]
---

Index 는 우리가 흔히 알고 있듯이, 어떠한 내용을 빠르게 찾기 위한 색인이다.

책을 읽을 때도 Index 를 통해 찾고 싶은 내용을 빠르게 접근할 수 있다. 

MySQL 과 같은 Database 에서도 이러한 Index 기능을 제공하는데, 이 때 주로 사용되는 자료구조는 B-tree 이다.

단순히 생각했을 때, 빠르게 찾는다면 Hash map 을 생각할 수도 있고, Binary Tree 를 떠올려 볼 수도 있다.

근데 왜 B-tree를 사용할까?

이번 글에서는 B-tree 가 무엇이고 어떤 장단점을 가지고 있으며, 왜 MySQL과 같은 Database 는 B-tree를 자료구조로 선택했는지 간략하게 알아보자.

# B-tree 란

B-tree의 B 는 주로 `Balanced` 라는 뜻으로 알려져있다. 즉, Left 와 Right 에 균형이 잡혀있다는 것이다. 

B-tree 는 Binary Tree가 확장된 구조인데, 하나의 노드가 가질 수 있는 자식 노드의 최대 숫자가 2보다 큰 트리 구조이다. 

<img width="952" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/b1d9c7da-ea14-4156-99d2-9d78f64cbc7f">

- 한 노드에 한가지 값이 아닌 여러 값을 가질 수 있다.
- 데이터가 정렬된 상태로 유지되어 있다.

## 왜 B-tree가 빠른가

- B-tree 의 가장 큰 장점 중 하나는 양쪽 자식의 균형을 유지한다는 것이다.
- 이를 통해서 탐색 시에 무조건 `O(logN)`의 Time Complexity 를 보장한다.
- 하지만 노드의 삽입 및 삭제 시에 재정렬하는 과정에서 많은 성능 저하를 초래한다.

# B+tree 란

<img width="948" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/5b47c027-34eb-4d6e-9825-9b5d702b93f5">

B+tree 는 B-tree 의 확장 개념인데, 데이터를 오직 Leaf Node에만 저장한다.

즉, Branch 노드에는 Key 만 담아두고, 해당 Key의 Data 를 가지고 있는 Leaf Node 를 가리키는 포인터를 가지고 있다. 

## B+tree 의 장점

- Leaf node를 제외하고 데이터를 담아두지 않기 때문에, 메모리 확보에 유용함.
- 하나의 노드에 더 많은 Key들을 담을 수 있어서, 트리의 높이가 더 낮아짐

# Index 자료구조로 B-tree를 선택한 이유

## Hash table 은 왜 안되는가

<img width="890" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/c52fcedf-2336-41e2-a4c5-c412319a02c8">

`Hash Table` 은 Key 값만 안다면 탐색의 시간복잡도가 `O(1)` 이기 때문에 매우 빠르다. 

하지만, 해당 값들은 정렬되어 있다는 것이 보장되지 않기 때문에 만약 Index로 Hash Table을 쓴다면 ***해당 Key의 작거나 큰 값이 어디있는지 찾는 부분에 있어서 O(1) 의 시간복잡도를 보장할수도 없을 뿐더러 매우 비효율적***이다.  즉, **범위에 대한 연산에 비효율적인 자료구조**이다. 

## 왜 Binary Tree가 아니라 B-Tree인가

이 둘의 가장 큰 차이는 `하나의 노드가 가지는 데이터 개수` 이다.

<img width="851" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/9b4ca507-5c2d-4b94-ac76-bcaeb269e61d">

ref. [https://helloinyong.tistory.com/296](https://helloinyong.tistory.com/296)

# Reference

[https://ko.wikipedia.org/wiki/B_트리](https://ko.wikipedia.org/wiki/B_%ED%8A%B8%EB%A6%AC)

[https://ko.wikipedia.org/wiki/B%2B_트리](https://ko.wikipedia.org/wiki/B%2B_%ED%8A%B8%EB%A6%AC)

[https://en.wikipedia.org/wiki/Hash_table](https://en.wikipedia.org/wiki/Hash_table)

[https://zorba91.tistory.com/293](https://zorba91.tistory.com/293)

[https://helloinyong.tistory.com/296](https://helloinyong.tistory.com/296)