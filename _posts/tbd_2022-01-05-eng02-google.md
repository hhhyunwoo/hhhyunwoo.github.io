---
layout: post
title: "[번역] Google Pro Tip: 대략적인 계산방식을 통한 최적의 디자인을 하기"
date: 2021-12-28
categories:
  - Trouble Shooting
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

> 다양한 기술 포스팅들이 올라오는 http://highscalability.com/ 사이트에는 양질의 개발관련 글이 올라온다. 그 중 시스템 설계를 위한 대략적인 계산 법에 대해 좋은 칼럼이 있어서 번역글을 작성해본다. 부족한 번역 실력 양해부탁한다.

_[원본 링크](http://highscalability.com/blog/2011/1/26/google-pro-tip-use-back-of-the-envelope-calculations-to-choo.html)_

## Google Pro Tip: 대략적인 계산방식을 통한 최적의 디자인을 하기

_[Back-Of-The-Envelope-Calculations : 일반적으로 봉투와 같은 사용 가능한 종이 조각에 적어 놓은 대략적인 계산이다.]_

주어진 문제에 대한 `최고` 의 설계가 어떤 것인지 어떻게 알 수 있을까?

예를 들어서, 30장의 썸네일의 결과값을 내놓는 이미지 검색 엔진을 설계한다면 당신은 이미지들을 순차적으로 불러올것인가?
혹은 병렬적으로?
캐싱은 할 건가?
이런 것들은 어떻게 결정을 할 것인가?

만약 너가 멀티버스의 힘([power of the multiverse](http://www.extravolution.com/2009/09/computing-with-multiverse.html))을 이용한다면, 생각하는 모든 옵션의 설계를 시도해보고 어떤 것이 가장 좋은지 확인할 수 있을 것이다.
하지만 그건 터무니없는 이야기이다.

다른 선택지는 대체 알고리즘의 순서를 고려하는 것이다.([order of various algorithm](https://en.wikipedia.org/wiki/Big_O_notation))
`계산적 사고` 황금기의 예언자인 `구글`은 분명이 이렇게 하겠지만, 또 다른 방법으로는 어떻게 하고 있을까?
