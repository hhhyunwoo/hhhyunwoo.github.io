---
layout: post
title: "[Linux] mmap() 에 대해서"
date: 2023-07-28
categories:
  - tech/infrastructure
tags: [
    linux,
    mmap,
    process,
    memory,
  ]
---
# mmap() 에 대해서

> `Memory Mapped I/O`는 마이크로프로세서(CPU)가 입출력 장치를 접근할 때, 입출력과 메모리의 주소 공간을 분리하지 않고 하나의 메모리 공간에 취급하여 배치하는 방식이다. -위키피디아-
> 

회사에서 검색 엔진 공부를 하고 있는데, 엔진 내부에서 데이터 사용을 위하여 Memory Store를 사용함.

여기서 `mmap` 을 사용하여 데이터 파일과 메모리를 동기화 하여 사용하고 있는데, mmap 에 대해서 명확하게 이해하기 위해서 정리를 해 봄

## Memory Mapped I/O란?

- 표준 파일 입출력의 대안으로 Application 의 `파일`을 `메모리`에 **맵핑할 수 있는 인터페이스**.
- `메모리 주소` - `파일 단어` 사이가 1대1 대응이 된다는 것
    - → 이를 통해서 Application(CPU) 에서는 데이터를 접근할 때 메모리에 상주하는 데이터처럼 메모리를 통해 파일에 직접 접근할 수 있음.
    - 또한 메모리 주소에 직접 쓰는 것만으로 디스크에 있는 파일에 기록할 수 있음.

## mmap()

- `mmap()`을 호출하면 **fd가 가리키는 파일의 offset 위치에서 len 바이트만큼 메모리에 맵핑하도록 커널에 요청**한다.

```c
#include <sys/mman.h>

void * mmap (void *addr,
             size_t len,
             int prot,
             int flags,
             int fd,
             off_t offset);
```

- `addr`
    - addr가 포함되면 메모리에서 해당 주소를  선호한다고 커널에 알려줌
    - 그저 힌트일 뿐이며 대부분 `0`을 넘겨줌
- `len`
    - fd 가 가리키는 파일의 `offset` 위치에서 `len` 바이트만큼 메모리에 맵핑하도록 커널에 요청함.
- `prot`
    - 접근권한을 지정
    - 맵핑에 원하는 메모리 보호 정책을 명시
        
        `PROT_NONE`: 접근 불가
        
        `PROT_READ`: 읽기 가능
        
        `PROT_WRITE`: 쓰기 가능
        
        `PROT_EXEC`: 실행 가능
        
- `flag`
    - 맵핑의 유형과 그 동작에 관한 몇 가지 요소를 명시
    - `MAP_FIXED` : mmap()의 addr 인자를 힌트가 아니라 요구사항으로 취급하도록 함
    - `MAP_PRIVATE` : 맵핑이 공유되지 않음을 명시. 파일은 copy-on-write 로 맵핑됨.
    - `MAP_SHARED` : 같은 파일을 맵핑한 모든 프로세스와 맵핑을 공유
    - `MAP_SHARED`와 `MAP_PRIVATE`를 함께 지정하면 안됨.
- 반환
    - 메모리 맵핑의 실제 시작 주소를 반환한다.
- fd를 맵핑하면 해당 파일의 참조 카운터가 증가한다.  → **따라서 파일을 맵핑한 후에 fd를 닫더라도 프로세스는 여전히 맵핑된 주소에 접근할 수 있다.**
- 예시
    - fd가 가리키는 파일의 첫 바이트부터 len 바이트까지를 읽기 전용으로 맵핑한다.
    
    ```c
    void *p;
    
    p = mmap (0, len, PROT_READ, MAP_SHARED, fd, 0);
    if (p == MAP_FAILED)
            perror ("mmap");
    ```
    
    - mmap() 에 전달하는 인자가 맵핑하는 과정
    
    ![image](https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/d838ab9d-ee39-4670-9a1e-f86a7fd4ac0a)
    

### How does mmap work on?

1. mmap 실행 시, Virtual Memory Address에 file 주소 매핑

![image](https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/ffd4ae02-1e97-42fd-9a51-35ac7a987e4d)

1. 해당 메모리 접근 시 1) Page Fault Interrupt 발생 / 2) OS에서 File data 복사해서 Physical Memory 에 넣어줌 

![image](https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/1df29685-b4c6-4a98-94a9-2db7f2bae451)

1. 메모리 Read 시, 해당 물리 페이지 데이터를 읽음
2. 메모리 Write 시, 해당 물리 페이지 데이터 수정 후, 페이지 상태의 dirty bit 가 1로 수정 됨

![image](https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/85ee82c6-629e-4049-9bce-96243344ae9b)

1. File Close 시, 물리 페이지 데이터가 File에 업데이트 됨 
- 궁금한 점
    - **Process의 메모리 공간에서 정확히 어떤 위치에 어떻게 매핑이 되는지?**
        - mmap 을 사용할 때 `flag` 의 `MAP_SHARED` 와 `MAP_PRIVATE` 에서 구분됨.
        - MAP_SHARED 를 사용했을 때는 Process의 Shared Memory 영역에 매핑이 되고, MAP_PRIVATE를 사용하면 Private Memory 영역에 매핑이 되는데 Private Memory 영역은 프로세스의 Data 영역과 Heap 영역을 의미함.
    - **mmap으로 매핑된 파일 write 을 수행하고, 동시에 해당 파일을 read() 했을 때 동기화가 바로 되는 것인지?**
        - 예시)
            - A 프로세스가 mmap() 으로 foo.txt 파일을 메모리로 읽어서 수정 작업을 진행함.
            - 동시에 B 프로세스가 fopen() 으로 동일한 foo.txt 파일을 읽고 있음.
            - 그럼 일관성이 유지되면서 동기화가 될까?
        - → fopen() 과 mmap() 은 메커니즘이 다르기 때문에 race condition이 일어날 수 있음.
        - mmap() 으로 file 을 읽고 수정했을 때, 실제로 해당 변경이 Disk에 있는 파일로 동기화 되는 타이밍은 아래와 같음
            - `MAP_PRIVATE`를 사용한 경우
                - 수정 작업은 메모리에만 적용되며, 디스크 파일은 수정되지 않음
            - `MAP_SHARED`를 사용한 경우
                - 메모리에 반영되면서, 프로세스들이 동시에 접근하는 파일 시스템을 통해 디스크 파일에도 자동으로 반영됨.

## munmap()

- `mmap()`으로 생성한 맵핑을 해제하기 위한 `munmap()` 시스템 콜을 제공함.

```c
#include <sys/mman.h>

int munmap (void *addr, size_t len);
```

- 페이지 크기로 정렬된 `addr`에서 시작해서 `len` 바이트만큼 이어지는 프로세스 주소 공간에 존재하는 페이지를 포함하는 맵핑을 해제함.
    - 맵핑 해제하고 다시 접근하면 `SIGSEGV` 시그널이 발생함.
- 성공 시 0을 반환, 실패 시 -1을 반환하고 errno 설정
- 예제
    - `[addr, addr+len]` 사이에 포함된 페이지를 담고 있는 메모리 영역에 대한 맵핑을 해제함.
    
    ```c
    if (munmap (addr, len) == −1)
            perror ("munmap");
    ```
    
- **exit() 에 의해서 자동으로 munmap 이 수행되긴 하지만, 그래도 직접 해주자**

## 맵핑 예제

```c
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>

// 인자로 파일 이름을 받음 
int main (int argc, char *argv[])
{
        struct stat sb;
        off_t len;
        char *p;
        int fd;

        if (argc < 2) {
                fprintf (stderr, "usage: %s <file>\n", argv[0]);
                return 1;
        }

        fd = open (argv[1], O_RDONLY);      // 인자로 넘겨받은 파일을 연다
        if (fd == −1) {
                perror ("open");
                return 1;
        }

        if (fstat (fd, &sb) == −1) {        // fstat : 주어진 파일에 대한 정보 반환 
                perror ("fstat");
                return 1;
        }

        if (!S_ISREG (sb.st_mode)) {        // 주어진 파일이 디바이스 파일이나 디렉터리가 아닌 일반 파일인지 점검 
                fprintf (stderr, "%s is not a file\n", argv[1]);
                return 1;
        }

        p = mmap (0, sb.st_size, PROT_READ, MAP_SHARED, fd, 0); // 맵핑 수행 
        if (p == MAP_FAILED) {
                perror ("mmap");
                return 1;
        }

        if (close (fd) == −1) {
                perror ("close");
                return 1;
        }

        for (len = 0; len < sb.st_size; len++)
                putchar (p[len]);

        if (munmap (p, sb.st_size) == −1) {
                perror ("munmap");
                return 1;
        }

        return 0;
}
```

## mmap()의 장점

- `read()`와 `write()` 시스템 콜을 사용하는 것보다 `mmap()`을 이용해서 파일을 조작하는 것이 좀 더 **유용하다**.
1. read, write 시스템 콜 사용할 때 발생하는 불필요한 복사를 방지할 수 있음. 
    - *사용자 영역의 버퍼로 데이터를 읽고 써야 하기 때문에 추가적인 복사가 발생함.*
2. *(잠재적인 **페이지 폴트** 가능성을 제외하면)* 시스템 콜 호출이나 컨텍스트 스위칭 오버헤드가 발생하지 않음
3. 여러 개의 프로세스가 같은 객체를 메모리에 맵핑한다면 데이터는 모든 프로세스 사이에서 공유된다.
4. `lseek()` 같은 시스템 콜을 사용하지 않고도 맵핑영역 탐색 가능

## mmap()의 단점

1. 메모리 맵핑은 항상 페이지 크기의 정수배만 가능하다. 
    - 예) 페이지 크기가 4k 이고 7byte를 맵핑하면 4089 byte가 낭비됨!
2. 메모리 맵핑은 반드시 프로세스의 주소 공간에 딱 맞아야한다. 
    - 다양한 사이즈의 맵핑이 있다면 `파편화`가 일어남
3. 메모리 맵핑과 관련 자료구조를 커널 내부에서 생성, 유지하는데 오버헤드가 발생한다. 
    - 이중 복사 제거 방법으로 방지할 수 있음
        
        > *읽기 요청마다 표준 입출력 버퍼를 가리키는 포인터를 반환하는 대체 구현을 통해 데이터를 표준 입출력 버퍼에서 직접 읽을 수 있음 → 불필요한 복사 피함*
        > 

→ 맵핑하려는 파일이 크거나 (낭비되는 공간이 전체 맵팽에서 낮은 비율일 때), 맵핑된 파일의 전체 크기가 페이지 크기로 딱 맞아 떨어질 때 (낭비되는 공간이 없는 경우) mmap() 의 장점을 극대화할 수 있음 

### Reference

- https://www.youtube.com/watch?v=8hVLcyBkSXY
- https://bannavi.tistory.com/80
- 시스템 프로래밍 책