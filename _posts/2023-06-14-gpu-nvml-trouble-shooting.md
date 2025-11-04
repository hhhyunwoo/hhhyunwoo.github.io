---
layout: post
title: "[GPU] NVML Function Not Found Error (ft. pynvml)"
date: 2023-06-14
categories:
  - tech/infrastructure
tags: [
    NVIDIA,
    GPU,
    nvml,
    pynvml,
  ]
---
Pytorch Serve 를 진행하는 중 아래와 같은 에러 발생

`AttributeError: /usr/lib/x86_64-linux-gnu/libnvidia-ml.so.1: undefined symbol: nvmlDeviceGetComputeRunningProcesses_v3`

`pynvml.nvml.NVMLError_FunctionNotFound: Function Not Found`

- **Full Log**

```python
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 850, in _nvmlGetFunctionPointer
    _nvmlGetFunctionPointer_cache[name] = getattr(nvmlLib, name)
  File "/usr/lib/python3.8/ctypes/__init__.py", line 382, in __getattr__
    func = self.__getitem__(name)
  File "/usr/lib/python3.8/ctypes/__init__.py", line 387, in __getitem__
    func = self._FuncPtr((name_or_ordinal, self))
AttributeError: /usr/lib/x86_64-linux-gnu/libnvidia-ml.so.1: undefined symbol: nvmlDeviceGetComputeRunningProcesses_v3

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "ts/metrics/metric_collector.py", line 27, in <module>
    system_metrics.collect_all(sys.modules['ts.metrics.system_metrics'], arguments.gpu)
  File "/usr/local/lib/python3.8/dist-packages/ts/metrics/system_metrics.py", line 119, in collect_all
    value(num_of_gpu)
  File "/usr/local/lib/python3.8/dist-packages/ts/metrics/system_metrics.py", line 90, in gpu_utilization
    statuses = list_gpus.device_statuses()
  File "/usr/local/lib/python3.8/dist-packages/nvgpu/list_gpus.py", line 75, in device_statuses
    return [device_status(device_index) for device_index in range(device_count)]
  File "/usr/local/lib/python3.8/dist-packages/nvgpu/list_gpus.py", line 75, in <listcomp>
    return [device_status(device_index) for device_index in range(device_count)]
  File "/usr/local/lib/python3.8/dist-packages/nvgpu/list_gpus.py", line 19, in device_status
    nv_procs = nv.nvmlDeviceGetComputeRunningProcesses(handle)
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 2608, in nvmlDeviceGetComputeRunningProcesses
    return nvmlDeviceGetComputeRunningProcesses_v3(handle);
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 2576, in nvmlDeviceGetComputeRunningProcesses_v3
    fn = _nvmlGetFunctionPointer("nvmlDeviceGetComputeRunningProcesses_v3")
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 853, in _nvmlGetFunctionPointer
    raise NVMLError(NVML_ERROR_FUNCTION_NOT_FOUND)
pynvml.nvml.NVMLError_FunctionNotFound: Function Not Found
```

# NVML 이란

NVIDIA Management Library

<img width="945" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/8a96062a-a0e4-4101-ab66-54f36cf9be57">

- `NVIDIA GPU 디바이스`들의 다양한 상태를 관리하고 모니터링하는 **C-based API**
- NVML 은 nvidia-smi 를 통해서 직접 쿼리와 커맨드를 날릴 수 있도록 제공함
- NVML 런타임 버전은 NVIDIA 디스플레이 드라이버와 함께 제공되며, SDK 는 적절한 헤더와 스텁 라이브러리 및 샘플 애플리케이션을 제공함

# Pynvml 이란

- GPU 관리 및 모니터링 함수에 대한 Python 인터페이스
- 즉, NVML 라이브러리 래핑 컴포넌트임.
- 11.0.0 버전부터는 pynvml 에서 사용되는 NVML-wrappers 은 nvidia-ml-py 와 동일하게 가져가고있음!

### Usage

```python
>>> from pynvml import *
>>> nvmlInit()
>>> print(f"Driver Version: {nvmlSystemGetDriverVersion()}")
Driver Version: 11.515.48
>>> deviceCount = nvmlDeviceGetCount()
>>> for i in range(deviceCount):
...     handle = nvmlDeviceGetHandleByIndex(i)
...     print(f"Device {i} : {nvmlDeviceGetName(handle)}")
...
Device 0 : Tesla K40c

>>> nvmlShutdown()
```

- 위와 같이 사용할 수 있음.
- 근데 이번 케이스 같은 경우 아래와 같이 에러가 발생

```python
>>> nvmlDeviceGetComputeRunningProcesses(handle)
Traceback (most recent call last):
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 850, in _nvmlGetFunctionPointer
    _nvmlGetFunctionPointer_cache[name] = getattr(nvmlLib, name)
  File "/usr/lib/python3.8/ctypes/__init__.py", line 382, in __getattr__
    func = self.__getitem__(name)
  File "/usr/lib/python3.8/ctypes/__init__.py", line 387, in __getitem__
    func = self._FuncPtr((name_or_ordinal, self))
AttributeError: /usr/lib/x86_64-linux-gnu/libnvidia-ml.so.1: undefined symbol: nvmlDeviceGetComputeRunningProcesses_v3

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 2608, in nvmlDeviceGetComputeRunningProcesses
    return nvmlDeviceGetComputeRunningProcesses_v3(handle);
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 2576, in nvmlDeviceGetComputeRunningProcesses_v3
    fn = _nvmlGetFunctionPointer("nvmlDeviceGetComputeRunningProcesses_v3")
  File "/usr/local/lib/python3.8/dist-packages/pynvml/nvml.py", line 853, in _nvmlGetFunctionPointer
    raise NVMLError(NVML_ERROR_FUNCTION_NOT_FOUND)
pynvml.nvml.NVMLError_FunctionNotFound: Function Not Found
```

# Solution

<img width="941" alt="image" src="https://github.com/hhhyunwoo/hhhyunwoo/assets/37402136/c83bc242-ec77-4333-94a1-b14498a11334">

- CUDA 버전 업그레이드를 하거나, pynvml 버전을 다운그레이드 해라!
- pynvml 버전을 11.4로 다운그레이드 해서 테스트 진행
- 정상동작함!

# Reference

[https://forums.developer.nvidia.com/t/unable-to-access-pynvml-methods/226914](https://forums.developer.nvidia.com/t/unable-to-access-pynvml-methods/226914)

[https://github.com/NVIDIA/k8s-device-plugin/issues/331](https://github.com/NVIDIA/k8s-device-plugin/issues/331)

[https://stackoverflow.com/questions/73591281/nvml-cannot-load-methods-nvmlerror-functionnotfound?noredirect=1#comment129972360_73591281](https://stackoverflow.com/questions/73591281/nvml-cannot-load-methods-nvmlerror-functionnotfound?noredirect=1#comment129972360_73591281)

[https://pypi.org/project/pynvml/](https://pypi.org/project/pynvml/)

[https://pypi.org/project/nvidia-ml-py/](https://pypi.org/project/nvidia-ml-py/)

[https://developer.nvidia.com/nvidia-management-library-nvml](https://developer.nvidia.com/nvidia-management-library-nvml)