const puppeteer = require('puppeteer');

const CLICKPOST_SESSION = process.env["CLICKPOST_SESSION"];
const YAHOO_ID = process.env["YAHOO_ID"];
const YAHOO_PASSWORD = process.env["YAHOO_PASSWORD"];
const CARD_CVC = process.env["CARD_CVC"];

if (!(CLICKPOST_SESSION && YAHOO_ID && YAHOO_PASSWORD)) {
  throw new Error("args error");
}

(async () => {
  const browser = await puppeteer.launch({
    devtools: !!process.env["DEBUG"],
    slowMo: 100
  });

  const page = await browser.newPage();

  // clickpost session
  await page.setCookie(
    {
      domain: "clickpost.jp",
      name: "_session_id",
      value: CLICKPOST_SESSION,
      secure: true,
      httpOnly: true
    }
  );

  // yahoo login
  await page.goto('https://login.yahoo.co.jp/config/login');
  await page.type('input[name="login"]', YAHOO_ID);
  let nextLoginLink = await page.$('#btnNext');
  nextLoginLink.click();

  await page.waitForSelector('input[name="passwd"]', { visible: true });
  await page.type('input[name="passwd"]', YAHOO_PASSWORD);
  let loginLink = await page.$('#btnSubmit');
  loginLink.click();
  await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});

  await page.goto('https://clickpost.jp/mypage/index');

  let listLink = await page.$('input[value="一時保存"]');
  listLink.click();
  await page.waitForSelector('.home_contents table tbody input[type="submit"]', {
    timeout: 30000
  });

  let firstPayment = await page.$('.home_contents table tbody input[type="submit"]');
  firstPayment.click();
  await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});

  let cvcInput = await page.$('#PaymentDispFormCVC');
  if (cvcInput) {
    page.type('#PaymentDispFormCVC', CARD_CVC);
  }
})();
