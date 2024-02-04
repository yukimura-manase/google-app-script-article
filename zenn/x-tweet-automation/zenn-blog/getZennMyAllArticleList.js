// NOTE: 定数・定義
/** Zenn の API Base URL */
const ZENN_BASE_URL = "https://zenn.dev";
/** Zenn の記事一覧を取得する API Path */
const ZENN_API_ARTICLE_LIST_PATH = "/api/articles?username=";
/** 記事一覧を取得したい User の userName */
const USER_NAME = "manase";

/** 保存する CSV のファイル名 */
const FINE_NAME = "zenn_articles.csv";

// Google Drive の Folder ID
const FOLDER_ID = "";

/**
 * NOTE: 該当のページ番号の Zenn の記事一覧を取得する関数
 * @param {Number} pageNumber ページ番号
 * @returns {Array} zennArticleList: Zenn の記事一覧
 * @returns {Number | null} NextPage: 次のページ番号
 */
function getZennArticleList(pageNumber) {
  console.log("Zenn の記事一覧を取得する・処理 Start");

  /** Zennの記事一覧を取得するAPIのURL */
  const userArticleListURL =
    ZENN_BASE_URL +
    ZENN_API_ARTICLE_LIST_PATH +
    USER_NAME +
    "&order=latest&page=" +
    pageNumber;
  console.log("Zenn API Call URL:", userArticleListURL);

  try {
    /** Zenn API からの レスポンス */
    const response = UrlFetchApp.fetch(userArticleListURL);
    // console.log("response: ", response);

    /** Fetch Result */
    const result = JSON.parse(response.getContentText());
    // console.log("result: ", result);

    /** Zenn の記事一覧リスト */
    const zennArticleList = result.articles;
    // console.log("Zenn の記事一覧:", zennArticleList);

    /**
     * 次のページ番号
     * - Number or null
     * - null の場合は、次のページがないことを意味する
     */
    const NextPage = result.next_page;
    // console.log("NextPage:", NextPage);
    console.log("Zenn の記事一覧を取得する・処理 End");

    return {
      zennArticleList,
      NextPage,
    };
  } catch (error) {
    console.error("Zenn の記事一覧取得 Block でエラーが発生しました", error);
  }
}

/**
 *  NOTE: Zenn のすべての記事一覧を取得する関数
 * @returns {Array} Zenn のすべての記事一覧
 */
function getZennAllArticleList() {
  console.log("Zenn のすべての記事一覧を取得する・処理 Start");

  /**
   * NOTE: Zenn の ページ番号
   * - Zenn の記事一覧取得 API は PageNation を実装しているため Page番号で、順に一覧取得をする
   * - 最初は、1ページ目から取得する
   */
  let pageNumber = 1;

  /**
   *  Fetch 制御 Flag
   * - true: Fetch を続ける
   * - false: Fetch を終了する
   */
  let isFetch = true;

  /** Zenn のすべての記事一覧リスト */
  let zennAllArticleList = [];

  try {
    /** 最後のページになるまで、Fetchを実行する */
    while (isFetch) {
      console.log("ページ番号:", pageNumber);

      /** 該当のページ番号の Zennの 記事一覧 を取得する */
      const results = getZennArticleList(pageNumber);

      console.log("Update前の記事の数", zennAllArticleList.length);
      console.log("追加で取得した記事の数", results.zennArticleList.length);

      /** 既存と取得したリストを Merge する */
      const updatedList = [...zennAllArticleList, ...results.zennArticleList];

      /** List を Update する */
      zennAllArticleList = updatedList;

      console.log("Update後の記事の数", zennAllArticleList.length);

      /**
       * 次のページ番号
       * - Number or null
       * - null の場合は、次のページがないことを意味する
       */
      const NextPage = results.NextPage;
      console.log("NextPage:", NextPage);

      // まだ、つづきのページがあるかどうかを確認する
      if (NextPage === null) {
        console.log("最後のページです");

        // 最後のページなので、Fetch を終了する
        isFetch = false;
      } else {
        console.log("次のページがあります");

        pageNumber = pageNumber + 1;
      }
    }
    console.log("Zenn のすべての記事一覧を取得する・処理 End");

    console.log("最終的な記事の総数", zennAllArticleList.length);

    return zennAllArticleList;
  } catch (error) {
    console.error(
      "Zenn のすべての記事一覧取得 Block でエラーが発生しました",
      error
    );
  }
}

/**
 * NOTE: Object の配列を受け取り CSV形式の文字列に変換する Func
 * @param {Array} objArray - Object の配列
 * @returns {String} csv - CSV形式の文字列
 */
function convertToCSV(objArray) {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;

  /** 1. Objectの Key を headerとして取り出す */
  let str =
    `${Object.keys(array[0])
      .map((value) => `"${value}"`)
      .join(",")}` + "\r\n";

  // 2. 各オブジェクトの値をCSVの行として追加する
  return array.reduce((str, next) => {
    str +=
      `${Object.values(next)
        .map((value) => `"${value}"`)
        .join(",")}` + "\r\n";
    return str;
  }, str);
}

/**
 * NOTE: CSV形式の文字列を Blob Object に変換する
 * @param {String} data - CSV形式の文字列
 * @param {String} name - ファイル名
 * @returns {Blob} blob - Blob Object
 */
function createBlob(csv, fileName) {
  const contentType = "text/csv";
  const charset = "utf-8";

  /** GAS の記法で Blob Object を作成する Type. CSV */
  const blob = Utilities.newBlob("", contentType, fileName).setDataFromString(
    csv,
    charset
  );
  return blob;
}

/**
 * NOTE: Google Drive にファイルを書き込む
 * @param {Blob} blob - Blob Object
 * @param {String} folderId - Google Drive の Folder ID
 * @returns {void}
 */
function writeDrive(blob, folderId) {
  // Google Drive の Folder を取得する
  const drive = DriveApp.getFolderById(folderId);
  // Google Drive にファイルを書き込む
  drive.createFile(blob);
}

/**
 * NOTE: Main Function
 */
function main() {
  // Zenn のすべての記事一覧を取得する
  const zennAllArticleList = getZennAllArticleList();
  // console.log("Zenn のすべての記事一覧:", zennAllArticleList);

  if (zennAllArticleList.length > 0) {
    console.log("Zenn に記事が投稿されています");

    /** Zenn のすべての記事一覧の中から必要なデータだけを抽出した Zenn の記事一覧 */
    const extractedZennArticleList = zennAllArticleList.map((element) => {
      return {
        title: element.title,
        url: `${ZENN_BASE_URL}${element.path}`,
        publishedAt: element.published_at,
        likesCount: element.liked_count,
      };
    });
    console.log(
      "必要なデータだけを抽出した Zenn の記事一覧:",
      extractedZennArticleList
    );

    /** CSV 形式の データ */
    const csvData = convertToCSV(extractedZennArticleList);

    // CSV ファイルを Blob Object に変換する
    const blob = createBlob(csvData, FINE_NAME);

    // Google Drive にファイルを書き込む
    writeDrive(blob, FOLDER_ID);
  } else {
    console.log("Zenn に記事が投稿されていません");
  }
}
