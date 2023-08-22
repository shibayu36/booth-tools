// CARD_CVC=... YAHOO_ID=... YAHOO_PASSWORD=... DEBUG=1 node pay-by-clickpost.js

const puppeteer = require("puppeteer");

const YAHOO_ID = process.env["YAHOO_ID"];
const YAHOO_PASSWORD = process.env["YAHOO_PASSWORD"];
const CARD_CVC = process.env["CARD_CVC"];

if (!(YAHOO_ID && YAHOO_PASSWORD)) {
  throw new Error("args error");
}

// 支払い待ちから一件支払う。
// 支払い待ちがなければ0、あれば1を返す
async function payOnce(page) {
  await page.goto("https://clickpost.jp/mypage/index");
  await page.waitForSelector('input[value="一時保存"]');
  let listLink = await page.$('input[value="一時保存"]');
  await listLink.click();

  await page.waitForSelector('.home_contents', { visible: true });
  let firstPayment = await page.$(
    '.home_contents table tbody input[type="submit"]'
  );
  if (!firstPayment) {
    return 0;
  }

  await firstPayment.click();
  await page.waitForNavigation();

  let cvcInput = await page.$("#cvv");
  if (cvcInput) {
    page.type("#cvv", CARD_CVC);
    await page.waitForTimeout(1000);
  }

  // 規約の合意
  const agreement = await page.click("#consent-matters-agree");

  // 次へ
  let paySubmit = await page.$("#action button");
  paySubmit.click();
  await page.waitForNavigation();

  let confirmSubmit = await page.$('input[value="支払手続き確定"]');
  confirmSubmit.click();
  await page.waitForNavigation();

  return 1;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: !!process.env["DEBUG"],
    slowMo: 50,
  });

  const page = await browser.newPage();

  // yahoo login
  {
    await page.goto("https://login.yahoo.co.jp/config/login", {
      waitUntil: "networkidle0",
    });
    await page.type('form[name="login_form"] input#login_handle', YAHOO_ID);
    let nextLoginLink = await page.$('form[name="login_form"] button:nth-of-type(1)');
    nextLoginLink.click();

    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', YAHOO_PASSWORD);
    let loginLink = await page.$('form[name="login_form"] button[type="submit"]');
    loginLink.click();
    await page.waitForNavigation({
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
  }

  console.log("yahoo login finished");

  // clickpost login
  {
    await page.goto("https://clickpost.jp/yahoo_logins/authorizing")
    await page.goto("https://clickpost.jp/mypage/index");
  }
  console.log("clickpost login finished");

  console.log("payment start");

  while (true) {
    let paymentExists = await payOnce(page);
    if (!paymentExists) {
      break;
    }
    // 素早く決済しすぎないように待つ
    await page.waitForTimeout(5000);
  }
  console.log("payment finish");

  browser.close();
})();
