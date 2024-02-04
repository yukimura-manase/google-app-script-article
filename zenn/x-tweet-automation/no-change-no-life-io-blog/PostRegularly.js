// X APIを使った OAuth2認証 & 投稿の定期実行のサンプル

/** ツイッターのクライアント識別子 */
const CLIENT_ID = "";
/** ツイッターのClient Secret */
const CLIENT_SECRET = "";
/** スプレッドシートのID */
const SHEET_ID = "";
/** 編集権限のある Google Acount の G_Mail */
const G_MAIL = "";

// 初回だけ必要な OAuth2・認証処理
function main() {
  const service = getService();

  Logger.log("初回だけ必要な OAuth2・認証処理 Start");

  if (service.hasAccess()) {
    Logger.log("認証済みです");
  } else {
    Logger.log("認証ができていません");
    const authorizationUrl = service.getAuthorizationUrl();
    Logger.log("次の URL を開いて、認証をします。: %s", authorizationUrl);
  }
}

// スプレッドシートからツイッターに投稿する記事をランダムに取得して、ツイート本文を作成する
function autoTweetFromSheet() {
  Logger.log("ツイート本文を作成する・処理 Start");
  let today = new Date();
  let todayStr = Utilities.formatDate(today, "JST", "yy-MM-dd");

  const mySpreadSheet = SpreadsheetApp.openById(SHEET_ID);
  Logger.log(mySpreadSheet);

  // 編集権限のある Google Acount の G_Mail を渡す
  mySpreadSheet.addEditor(G_MAIL);

  const sheetList = mySpreadSheet.getSheets();
  Logger.log(sheetList);

  // 1番目のスプレッドシートを取得する
  const sheet = mySpreadSheet.getSheets()[0];
  Logger.log(sheet);

  let lastRow = sheet.getLastRow();

  let targetRow = makeRundom(lastRow);

  let title = sheet.getRange(targetRow, 1).getValue();
  let link = sheet.getRange(targetRow, 2).getValue();

  let msg =
    "【Tech Blog おすすめ記事紹介　" +
    todayStr +
    "】\n\n" +
    title +
    "\n\n" +
    "詳細は以下をチェック♪" +
    "\n\n" +
    link +
    "\n";

  return msg;
}

// 乱数作成
function makeRundom(count) {
  let random = Math.random();
  random = Math.floor(random * count) + 1;
  return random;
}

// X(Service) に X-API, OAuth2 を使って Access する
function getService() {
  pkceChallengeVerifier();
  const userProps = PropertiesService.getUserProperties();
  const scriptProps = PropertiesService.getScriptProperties();

  // X-Service作成
  return OAuth2.createService("twitter")
    .setAuthorizationBaseUrl("https://twitter.com/i/oauth2/authorize")
    .setTokenUrl(
      "https://api.twitter.com/2/oauth2/token?code_verifier=" +
        userProps.getProperty("code_verifier")
    )
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setCallbackFunction("authCallback")
    .setPropertyStore(userProps)
    .setScope("users.read tweet.read tweet.write offline.access")
    .setParam("response_type", "code")
    .setParam("code_challenge_method", "S256")
    .setParam("code_challenge", userProps.getProperty("code_challenge"))
    .setTokenHeaders({
      Authorization:
        "Basic " + Utilities.base64Encode(CLIENT_ID + ":" + CLIENT_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    });
}

// 認証後のCallBack
function authCallback(request) {
  const service = getService();
  const authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput("Success!");
  } else {
    return HtmlService.createHtmlOutput("Denied.");
  }
}

function pkceChallengeVerifier() {
  var userProps = PropertiesService.getUserProperties();
  if (!userProps.getProperty("code_verifier")) {
    var verifier = "";
    var possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    for (var i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var sha256Hash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      verifier
    );

    var challenge = Utilities.base64Encode(sha256Hash)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    userProps.setProperty("code_verifier", verifier);
    userProps.setProperty("code_challenge", challenge);
  }
}

function logRedirectUri() {
  var service = getService();
  Logger.log(service.getRedirectUri());
}

// ツイートを実行する
function sendTweet() {
  const payload = {
    text: autoTweetFromSheet(),
  };
  Logger.log("ツイートを実行する");

  const service = getService();
  if (service.hasAccess()) {
    Logger.log("サービスアクセス完了 ツイート処理を続行する");

    const url = `https://api.twitter.com/2/tweets`;
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + service.getAccessToken(),
      },
      muteHttpExceptions: true,
      payload: JSON.stringify(payload),
    });
    const result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const lastRow = sheet.getLastRow();
    let now = new Date();
    sheet.getRange(lastRow + 1, 1).setValue(result["data"]["id"]);
    sheet.getRange(lastRow + 1, 2).setValue(result["data"]["text"]);
    sheet.getRange(lastRow + 1, 3).setValue(now);
  } else {
    Logger.log("認証ができていません");
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log("次の URL を開いて、認証をします。: %s", authorizationUrl);
  }
}
