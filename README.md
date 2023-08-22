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
- boothのhttps://manage.booth.pm/orders?state=paid から宛名印刷用CSVをダウンロード
- CSVをスプレッドシートにインポート
- 氏名と商品番号の列だけを表示
- ナンバー付けて逆順に(申し込み順になるように)

### boothの宛名リストからクリックポストの
https://manage.booth.pm/orders?state=paid から「宛名印刷用CSV」をダウンロード。

```
carton exec -- perl booth2clickpost.pl ~/Downloads/booth_orders_20200521121532.csv
```

clickpost1.csv, clickpost2.csv, ...とまとめてクリックポストに入れられる件数ごとにファイルが出力される
