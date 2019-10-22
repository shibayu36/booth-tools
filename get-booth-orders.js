// Usage
// PIXIV_ID=... PIXIV_PASSWORD=... node get-booth-orders.js

const puppeteer = require('puppeteer-extra');
const fs = require('fs');

const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

// 注文リスト1ページから購入情報を抜き出す
async function getOrders(browser, page) {
  let orderPage = await browser.newPage();

  // 商品リンクを抜き出す
  let orderLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a.link-ext')).map(a => a.href);
  });

  // それぞれの商品詳細から名前、商品リストを抜き出す
  let rows = [];
  for (let link of orderLinks) {
    await orderPage.goto(link);
    let row = await orderPage.evaluate(() => {
      let panel = document.querySelectorAll('.manage-panel')[0];
      let name = panel.querySelector('.manage-order-shipment-summaries .u-tpg-slight-body').textContent.match(/(.+)\s+様/)[1];
      let productContainers = panel.querySelectorAll('.manage-order-content');
      let products = Array.from(productContainers).map(c => c.querySelector('.u-tpg-slight-body a.nav-reverse').innerText.trim() + " : " + c.querySelector('.u-text-right b').innerText);
      return name + "\t" + products.sort().reverse().join("\t");
    });
    console.log(row);
    rows.push(row);
  }

  await orderPage.close();
  return rows;
}

(async () => {

  const browser = await puppeteer.launch({
    devtools: !!process.env["DEBUG"],
    slowMo: 50
  });
  let page = await browser.newPage();

  // loginする
  await page.goto('https://accounts.pixiv.net/login?view_type=popup&source=booth&return_to=https%3A%2F%2Faccounts.pixiv.net%2Fpopup.html%23https%3A%2F%2Fbooth.pm%2Fusers%2Fsign_in');
  await page.type('#LoginComponent input[autocomplete="username"]', process.env.PIXIV_ID);
  await page.type('#LoginComponent input[autocomplete="current-password"]', process.env.PIXIV_PASSWORD);
  await page.click('#LoginComponent button[type="submit"]');
  await page.goto('https://booth.pm/users/sign_in');
  console.log("finish to login");


  // 未発送ページへ
  await page.goto('https://manage.booth.pm/orders?state=paid');

  // 未発送ページを全部たどって購入状況を全てたどる
  let results = [];
  while (true) {
    console.log("start : " + page.url());
    let rows = await getOrders(browser, page);
    results = results.concat(rows);

    let nextLink = await page.$('a[rel="next"]');
    if (nextLink) {
      nextLink.click();
      await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});
    }
    else {
      break;
    }
  }

  fs.writeFileSync('result.tsv', results.join("\n"));

  browser.close();

  console.log('done');
})();
