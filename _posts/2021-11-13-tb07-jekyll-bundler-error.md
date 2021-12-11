---
layout: post
title: "[Trouble Shooting] Jekyll chirpy 템플릿으로 Github 블로그 시작하기. (Bundler Install Error)"
date: 2021-11-13
categories:
  - Trouble Shooting
  - ETC
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

# Jekyll chirpy 템플릿으로 Github 블로그 시작하기. (Bundler Install Error)

## Github 블로그 with Chirpy Jekyll Theme

github 블로그를 시작할 때 Jekyll을 많이 사용한다.
그럼 Jekyll이 무엇일까?

### Jekyll?

- 텍스트 변환 엔진으로, Markup 언어로 글을 작성하면 이를 통해 웹사이트를 만들어줌.
- 서버 소프트웨어가 필요 없어 매우 빠르고 가볍다.

-> Jekyll을 사용한 템플릿을 땡겨와서 블로그를 시작하면 기본 틀을 잡기 매우 간편하다.

### Chirpy

- Jekyll을 이용한 여러 템플릿을 제공해준다.
- Git : https://github.com/cotes2020/jekyll-theme-chirpy
- Tutorial : https://chirpy.cotes.info/categories/tutorial/

-> Readme를 꼼꼼히 읽어보면 시작하는 방법이 상세하게 나와있다.

(사실 비전공자의 입장에서 본다면 시작하기가 꽤나 까다로울 수도...)

---

## 처음 시작

_[ Mac 환경에서 진행함 ]_

```shell
$ brew install ruby
$ bundle
$ bundle exec jekyll s  # Running Local Server
```

먼저 bundle을 설치해야한다.

### Bundler 란?

-> **Bundler는 정확히 필요한 gem과 그 gem의 버전을 설치하고, 추적하는 것으로 일관성 있는 Ruby 프로젝트를 제공하는 도구!**

근데 bundle 명령어를 칠 떄마다

```bash
An error occurred while installing racc (1.6.0), and Bundler cannot continue.
```

요런 비슷한 에러가 자꾸 발생했다.

### 해결책

```bash
xcode-select --install
sudo gem install -n /usr/local/bin cocoapods
```

요걸로 설치가 되면 끝! (참고 : https://hello-bryan.tistory.com/208)
하지만 나는...

```bash
xcode-select: error: command line tools are already installed, use "Software Update" to install updates
```

이런 에러가 다시 떴다.

```shell
$ sudo rm -rf /Library/Developer/CommandLineTools
$ sudo xcode-select --install

다시 깔아줬음 그랬더니 gem 으로 설치됨. bundler 도 설치된다.
sudo gem install -n /usr/local/bin cocoapods
```

(참고 : https://blog.ddoong2.com/2019/10/09/Install-Command-Line-Tool/)

-> 이렇게 했더니 bundler 설치 완료!!

그 외의 것들은 Chirpy Jekyll Theme 튜토리얼을 잘 따라하면 블로그 포스팅이 완료된다.

Github Action을 이용해서 page를 만들어주는게 독특했다.
