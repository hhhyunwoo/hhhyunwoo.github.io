---
layout: post
title: "[Audio] ffprobe 설명 및 사용법"
date: 2021-12-26
categories:
  - Audio
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

# ffprobe 설명 및 사용법

## ffprobe 이란?

많이 알려져 있는 `ffmpeg`은 미디어 포맷을 변환하는데 사용하는 도구라면, <br>
`ffprobe`는 쉽게 말해 간단한 `멀티미디어 Stream 분석기`이다.

[_공식 문서 : https://ffmpeg.org/ffprobe.html_]

## 사용

- 나는 서버 상에서 사용을 해야하는데, 설치하지 못하는 환경이라서 docker image를 이용해 run을 시켰다.

Command

- output 을 `json`으로 출력을 하였고 몇 가지 옵션을 추가하였다.

```
$ docker run --rm -v /home:/config DOCKER_IMAGE:latest
ffprobe -v quiet
-print_format json
-show_format
-show_streams
/config/test1.wav
```

Output

- 아래의 결과 값과 같이 해당 미디어의 다양한 `Key`값들을 분석해서 보여줄 수 있다.

```
{
    "streams": [
        {
            "index": 0,
            "codec_name": "pcm_s16le",
            "codec_long_name": "PCM signed 16-bit little-endian",
            "codec_type": "audio",
            "codec_time_base": "1/16000",
            "codec_tag_string": "[1][0][0][0]",
            "codec_tag": "0x0001",
            "sample_fmt": "s16",
            "sample_rate": "16000",
            "channels": 1,
            "bits_per_sample": 16,
            "r_frame_rate": "0/0",
            "avg_frame_rate": "0/0",
            "time_base": "1/16000",
            "duration_ts": 49920,
            "duration": "3.120000",
            "bit_rate": "256000",
            "disposition": {
                "default": 0,
                "dub": 0,
                "original": 0,
                "comment": 0,
                "lyrics": 0,
                "karaoke": 0,
                "forced": 0,
                "hearing_impaired": 0,
                "visual_impaired": 0,
                "clean_effects": 0,
                "attached_pic": 0,
                "timed_thumbnails": 0
            }
        }
    ],
    "format": {
        "filename": "/config/test1.wav",
        "nb_streams": 1,
        "nb_programs": 0,
        "format_name": "wav",
        "format_long_name": "WAV / WAVE (Waveform Audio)",
        "duration": "3.120000",
        "size": "99884",
        "bit_rate": "256112",
        "probe_score": 99
    }
}
```
