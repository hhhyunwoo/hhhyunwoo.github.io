---
layout: post
title: "[Golang] map, slice, list 정리 "
date: 2022-07-23
categories:
  - tech/infrastructure
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

# [Golang] map, slice, list 정리

## Array

- 고정길이 배열
    - 배열 크기를 동적으로 증가시키거나 부분 배열을 잘라내는 기능 없음.
- 배열의 크기를 데이터 타입 앞에 써줘야 함

```go
package main
func main() {
    var a [3] int
    a[0] = 1
    a[1] = 2
    a[2] = 3
    println(a[1])
```

- 초기화
    - 값을 지정해주지 않으면 0으로 초기화가 됨.

```go
var a = [3]int{1,2,3}

var b = [...]int{1,2,3}
```

## Slice

- 가변길이 배열. Python 의 List와 유사!
- Array와는 다르게 고정된 크기를 미리 지정하지 않을 수 있고, 동적으로 변경 가능.
- 부분 잘라내기 가능
- 선언
    - `var v []T`
    - make(`slice_type`, `slice_length`, `capacity`) 함수
        - capacity : 내부 배열의 최대 길이
            - 생략 시 capacity는 length와 동일
        - 모든 요소가 zero value인 슬라이스를 생성함.

```go
package main
func main() {
    var a []int
    a = []int{1,2,3}
    a[1] = 10
    println(a)
}

---

func main() {
    s := make([]int, 5, 10)
    println(len(s), cap(s))
}

---

ss := s[0:11]
// 가변길이보다 더 큰 값을 주면 에러 발생 
-> panic: runtime error: slice bounds out of range

---

s := make([]int, 5, 10)
ss := s[0:10]
fmt.Println(s)
fmt.Println(ss)
ss = append(ss, 1)
sss := ss[0:11]
fmt.Println(sss)
```

- Sub-slice
    
    ```go
    func main(){
        s := []int{0,1,2,3,4,5}
        s = s[2:5]
    }
    ```
    
- Append & Copy
    
    ```go
    func main() {
        s := []int{0,1}
        s = append(s,2)
        s = append(s,3,4,5)
    }
    ```
    

## Map

- Key-value 쌍으로 된 데이터 타입.
- Python의 Dictionary와 유사

```go
var sMap map[int]string

---

sMap = make(map[int]string)

---

tickers := map[string]string{
    "GOOG": "Google Inc",
    "MSFT": "Microsoft",
    "FB":   "FaceBook",
}
```