# Zenn の API を分析する

## Zenn の記事一覧を取得する方法

1. RSS を活用する方法

2. 非公式の Zenn API を使用する方法

- `username`の`value`を自分のものにすれば、自分の記事一覧を取得することができる。
- 事例(私の場合)：`https://zenn.dev/api/articles?username=manase&order=latest`

##### まさぴょんの Zenn の記事一覧

- `https://zenn.dev/api/articles?username=manase&order=latest`

## 実際に、JSON で取得してみる

- json で取得できたのは、48 件

- 1/27 時点で 記事は、55 件を公開中 なので、おそらくページネーションされている API だと思われる

- 上限、48？

- "next_page": 2 とあるので、ページネーションだと思われる.

  - 試しに、QueryParameter に page を追加してみたら、ページネーション設定ごとに、記事一覧を取得できた。

  - `https://zenn.dev/api/articles?username=manase&order=latest&page=1`

    - `"next_page":2` になっている

  - `https://zenn.dev/api/articles?username=manase&order=latest&page=2`

    - `"next_page":null` になっている

## データ構造から、取得したいデータを選ぶ

1. title: 記事名

2. path: 記事の相対 Path

## 参考・引用

1. [Zenn の CLI, API などについて](https://zenn.dev/manase/scraps/489f556f7ff15b)

2. [Zenn の投稿を取得してブログに取り込む](https://zenn.dev/niiharamegumu/articles/8f00cfdf9753d1)
