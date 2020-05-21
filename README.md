# booth-tools

## Setup
```
nodenv install
npm install -g yarn
yarn install
```

```
cpanm -q --notest Carton
carton install
```

## Usage

### 購入商品リストを出す
```
DEBUG=1 PIXIV_ID=... PIXIV_PASSWORD=... node get-booth-orders.js
```

### boothの宛名リストからクリックポストの
https://manage.booth.pm/orders?state=paid から「宛名印刷用CSV」をダウンロード。

```
carton exec -- perl booth2clickpost.pl ~/Downloads/booth_orders_20200521121532.csv
```

clickpost1.csv, clickpost2.csv, ...とまとめてクリックポストに入れられる件数ごとにファイルが出力される
