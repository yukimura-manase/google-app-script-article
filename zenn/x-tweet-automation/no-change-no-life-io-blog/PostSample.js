// X APIを使った OAuth2認証 & 投稿のサンプル

const CLIENT_ID = "";
const CLIENT_SECRET = "";

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

// X(Service) に X-API, OAuth2 を使って Access する
function getService() {
  pkceChallengeVerifier();
  const userProps = PropertiesService.getUserProperties();
  const scriptProps = PropertiesService.getScriptProperties();
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
  var payload = {
    text: "Test tweet from GAS",
  };
  Logger.log("ツイートを実行する");

  var service = getService();
  if (service.hasAccess()) {
    Logger.log("サービスアクセス完了 ツイート処理を続行する");
    var url = `https://api.twitter.com/2/tweets`;
    var response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + service.getAccessToken(),
      },
      muteHttpExceptions: true,
      payload: JSON.stringify(payload),
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    Logger.log("認証ができていません");
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log("次の URL を開いて、認証をします。: %s", authorizationUrl);
  }
}
