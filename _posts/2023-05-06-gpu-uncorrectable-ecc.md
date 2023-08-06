---
layout: post
title: "[GPU] uncorrectable ECC 에러로 인한 GPU 카드 인식 불가 현상"
date: 2023-05-06
categories:
  - GPU
tags: [
    gpu,
    uecc,
    nvidia,
    memory,
  ]
---

## Description

- 수백장의 GPU 카드를 기반으로 한 `Kubernetes` on-premise 클러스터를 운영하는 도중, 갑자기 특정 장비에 꽂혀있는 **8장의 GPU** 중 **1장의 카드**가 인식이 안되는 현상이 발생
- 아래와 같이 해당 노드를 `kubectl describe node` 로 확인하였을 때는, 1장이 누락된 `7장`만 **Allocatable** 로 나타는 것을 확인할 수 있음

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/0833ce6b-d901-42d6-a02b-bcd329101113)

- 하지만 장비에 들어가서 nvidia-smi 로 확인하였을 때, 따로 GPU 를 사용중인 프로세스는 없었음.
- Kubernetes 에서 GPU 사용에 필요한 `nvidia-device-pulgin` **Daemonset** 로그를 보았을 때 아래와 같은 에러로그가 찍히고 있었음

```bash
08:08:58 'nvidia.com/gpu' device marked unhealthy: GPU-XX-X-X-XX-XX
08:08:58 XidCriticalError: Xid=94 on Device=GPU-XX-X-X-XX-XX, the device will go unhealthy.
```

## Cause

- 해당 GPU 카드를 사용하던 도중 uncorrectable ECC 에러가 발생해서 해당 카드의 Memory에 문제가 생겨, unhealthy 로 marking 이 되는 것이 아닐까라고 인프라쪽에서 추측하심

![image](https://github.com/hhhyunwoo/leetcode/assets/37402136/0dc44558-3321-465b-a2e3-514a5f3d4484)

- 위의 사진에서 체크된 것처럼 `Uncorr. ECC` 칼럼에 `0`이 아니라 `23`이라는 값이 들어가 있음

### Uncorrectable ECC 란?

[Nvidia GPU uecc error Docs](https://docs.nvidia.com/deploy/a100-gpu-mem-error-mgmt/index.html#response-uncorrectable-contained-ecc-errors)
<img width="1033" alt="image" src="https://github.com/hhhyunwoo/leetcode/assets/37402136/e34a1b07-8087-4251-8075-1a711d0cc688">

- `ECC` : Error Correcting Code
    - **메모리의 기능 중 하나를 나타내는 것인데, ECC는 데이터 저장 장치나 메모리 시스템에서 발생하는 에러를 검출하고 수정하는 기술**
- 즉, Uncorrectable ECC 에러는 ECC 기능이 오류를 검출하고 수정하지 못한 경우를 의미함.
- 따라서 메모리에서 발생한 오류가 ECC로는 복구할 수 없는 상태라는 것을 의미.
- **Uncorrectable ECC 에러가 발생하는 경우, 일반적으로 해당 GPU 카드를 교체하거나 기술 지원을 받아서 처리해야함**

## Solution

- 기본적으로 이런 하드웨어 이슈는 인프라쪽에서 서포트를 해주시기 때문에 인프라 팀에서 도움을 주셨다.
- 먼저 자동 복구될 수 있는 상황인지 확인한 후에, 카드 리셋을 수행해야함.
- 그리고 리셋으로 복구가 되지 않는 상황이면, 재부팅을 수행해야 함
- 그래도 해결되지 않으면, 해당 GPU 카드를 교체하는 작업이 필요함
- 우리는 해당 카드를 교체하여 문제를 해결하였다.