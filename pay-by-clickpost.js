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
  listLink.click();

  await page.waitForNavigation({ waitUntil: "networkidle0" });
  let firstPayment = await page.$(
    '.home_contents table tbody input[type="submit"]'
  );
  if (!firstPayment) {
    return 0;
  }

  firstPayment.click();
  await page.waitForNavigation();

  let cvcInput = await page.$("#PaymentDispFormCVC");
  if (cvcInput) {
    page.type("#PaymentDispFormCVC", CARD_CVC);
    await page.waitForTimeout(1000);
  }

  let paySubmit = await page.$("input#CompleteBtn");
  paySubmit.click();
  await page.waitForNavigation();

  let confirmSubmit = await page.$('input[value="支払手続き確定"]');
  confirmSubmit.click();
  await page.waitForNavigation();

  return 1;
}

(async () => {
  const browser = await puppeteer.launch({
    devtools: !!process.env["DEBUG"],
    slowMo: 50,
  });

  const page = await browser.newPage();

  // yahoo login
  {
    await page.goto("https://login.yahoo.co.jp/config/login", {
      waitUntil: "networkidle0",
    });
    await page.type('input[name="login"]', YAHOO_ID);
    let nextLoginLink = await page.$("#btnNext");
    nextLoginLink.click();

    await page.waitForSelector('input[name="passwd"]', { visible: true });
    await page.type('input[name="passwd"]', YAHOO_PASSWORD);
    let loginLink = await page.$("#btnSubmit");
    loginLink.click();
    await page.waitForNavigation({
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
  }

  console.log("yahoo login finished");

  // clickpost login
  {
    await page.goto("https://clickpost.jp/mypage/index");

    let yLoginButton = await page.$('.logInBtn a[href="/auth/yconnect"]');
    yLoginButton.click();

    await page.waitForSelector('button[type="submit"]');
    let submitButton = await page.$('button[type="submit"]');
    submitButton.click();
    await page.waitForNavigation();
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
