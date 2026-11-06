"use strict";


// ==================================================
// DOM要素
// ==================================================

const QR_QRcode_reader_button =
  document.getElementById(
    "QR_QRcode_reader_button"
  );

const QR_QRcode_reader_result =
  document.getElementById(
    "QR_QRcode_reader_result"
  );

const QR_QRcode_reader_camera_select =
  document.getElementById(
    "QR_QRcode_reader_camera_select"
  );

const QR_QRcode_reader_camera_reload_button =
  document.getElementById(
    "QR_QRcode_reader_camera_reload_button"
  );

const QR_QRcode_reader_camera_status =
  document.getElementById(
    "QR_QRcode_reader_camera_status"
  );

const QR_connection_status =
  document.getElementById(
    "QR_connection_status"
  );

const QR_station_id =
  document.getElementById(
    "QR_station_id"
  );

const QR_pairing_code =
  document.getElementById(
    "QR_pairing_code"
  );

const QR_pairing_code_area =
  document.getElementById(
    "QR_pairing_code_area"
  );

const QR_pairing_code_input =
  document.getElementById(
    "QR_pairing_code_input"
  );

const QR_connect_pin_button =
  document.getElementById(
    "QR_connect_pin_button"
  );

const QR_pin_status =
  document.getElementById(
    "QR_pin_status"
  );

const QR_send_status =
  document.getElementById(
    "QR_send_status"
  );

const QR_last_scan_area =
  document.getElementById(
    "QR_last_scan_area"
  );

const QR_last_scan_id =
  document.getElementById(
    "QR_last_scan_id"
  );

const QR_resend_button =
  document.getElementById(
    "QR_resend_button"
  );

const QR_reset_result_button =
  document.getElementById(
    "QR_reset_result_button"
  );

const QR_send_form =
  document.getElementById(
    "QR_send_form"
  );

const QR_send_session_id =
  document.getElementById(
    "QR_send_session_id"
  );

const QR_send_station_id =
  document.getElementById(
    "QR_send_station_id"
  );

const QR_send_pairing_code =
  document.getElementById(
    "QR_send_pairing_code"
  );

const QR_send_payload =
  document.getElementById(
    "QR_send_payload"
  );

const QR_send_source =
  document.getElementById(
    "QR_send_source"
  );

const QR_reader_notice =
  document.getElementById(
    "QR_reader_notice"
  );

const QR_reader_mode_entry =
  document.getElementById(
    "QR_reader_mode_entry"
  );

const QR_reader_mode_select =
  document.getElementById(
    "QR_reader_mode_select"
  );


// ==================================================
// 定数
// ==================================================

const QR_QRcode_reader_user_id_check_text =
  /^[USAT]\d{2}-\d{5}$/;

const QR_QRcode_reader_pre_id_check_text =
  /^P\d{2}-\d{5}$/;

const QR_QRcode_reader_qr_card_check_text =
  /^(?:1SCJ\|user\|)?[UT]\d{2}-\d{5}\|[0-9a-fA-F]{64}$/i;

const QR_QRcode_reader_staff_card_check_text =
  /^1SCJ\|staff\|([SA]\d{2}-\d{5})\|[0-9a-fA-F]{64}$/i;

const QR_QRcode_reader_duplicate_wait =
  2000;

const QR_send_duplicate_wait =
  3000;

const QR_send_unlock_wait =
  1500;


// ==================================================
// 読み取りモード
// ==================================================

let QR_reader_mode =
  "operation";


// ==================================================
// カメラ関連の状態
// ==================================================

let QR_QRcode_reader_camera_on_off =
  false;

let QR_QRcode_reader_scanner =
  null;

let QR_QRcode_reader_last_id =
  null;

let QR_QRcode_reader_last_time =
  0;

let QR_QRcode_reader_result_text =
  null;

let QR_QRcode_reader_stopping =
  false;


// ==================================================
// 接続関連
// ==================================================

let QR_receiver_url =
  "";

let QR_session_id =
  "";

let QR_station_id_value =
  "";

let QR_pairing_code_value =
  "";

let QR_source =
  "phone";

let QR_send_busy =
  false;

let QR_last_sent_payload =
  "";

let QR_last_sent_time =
  0;

let QR_connection_valid =
  false;


// ==================================================
// 接続情報
// ==================================================

function QR_loadConnection()
{
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  QR_receiver_url =
    String(
      parameters.get(
        "receiverUrl"
      )
      || ""
    ).trim();

  QR_session_id =
    String(
      parameters.get(
        "sessionId"
      )
      || ""
    ).trim();

  QR_station_id_value =
    String(
      parameters.get(
        "stationId"
      )
      || ""
    )
      .trim()
      .toLowerCase();

  QR_pairing_code_value =
    String(
      parameters.get(
        "pairingCode"
      )
      || ""
    ).trim();

  if(QR_pairing_code_input !== null)
  {
    QR_pairing_code_input.value =
      QR_pairing_code_value;
  }

  QR_source =
    String(
      parameters.get(
        "source"
      )
      || "phone"
    )
      .trim()
      .toLowerCase();

  if(
    QR_source !== "phone"
    &&
    QR_source !== "pc_camera"
  )
  {
    QR_source =
      "unknown";
  }

  const requestedReaderMode =
    String(
      parameters.get(
        "readerMode"
      )
      || "operation"
    )
      .trim()
      .toLowerCase();

  if(
    requestedReaderMode === "register"
  )
  {
    QR_reader_mode =
      "register";
  }
  else if(
    requestedReaderMode === "visit"
  )
  {
    QR_reader_mode =
      "visit";
  }
  else
  {
    QR_reader_mode =
      "operation";
  }

  QR_station_id.textContent =
    QR_station_id_value
    || "未設定";

  QR_pairing_code.textContent =
    QR_pairing_code_value
    || "未設定";

  if(
    QR_pairing_code_area !== null
  )
  {
    QR_pairing_code_area.style.display =
      (
        QR_reader_mode === "register"
        ||
        QR_reader_mode === "visit"
      )
        ? ""
        : "none";
  }

  QR_applyReaderMode();

  if(QR_reader_mode_select !== null)
  {
    QR_reader_mode_select.value =
      QR_reader_mode;
  }

  if(!QR_hasValidConnection())
  {
    QR_connection_valid =
      false;

    QR_connection_status.textContent =
      "PCとの接続情報が不足しています。\n"
      + "PC側で発行された接続URLを開くか、"
      + "PC画面に表示された6桁のPINを入力すれば接続できます。";

    QR_connection_status.style.color =
      "red";

    if(QR_reader_mode_entry !== null)
    {
      QR_reader_mode_entry.style.display =
        "";
    }

    QR_showSendStatus(
      "接続されていないため、読取結果は送信されません。PINを設定して接続してください。",
      "red"
    );

    return false;
  }

  if(
    !QR_isAllowedReceiverUrl(
      QR_receiver_url
    )
  )
  {
    QR_connection_valid =
      false;

    QR_connection_status.textContent =
      "GASの送信先URLが正しくありません。";

    QR_connection_status.style.color =
      "red";

    QR_showSendStatus(
      "安全でない送信先が指定されています。",
      "red"
    );

    return false;
  }

  QR_connection_valid =
    true;

  if(QR_hasValidPairingCode())
  {
    QR_pin_status.textContent =
      "URLに含まれるPINを読み込みました。必要ならPC画面のPINで上書きできます。";
    QR_pin_status.style.color = "green";
    QR_connection_status.textContent =
      (QR_reader_mode === "register" ? "利用者登録" : QR_reader_mode === "visit" ? "入場受付" : "operation")
      + "画面の接続情報を読み込みました。";
    QR_connection_status.style.color = "green";
  }
  else
  {
    QR_connection_status.textContent =
      (QR_reader_mode === "register" ? "利用者登録" : QR_reader_mode === "visit" ? "入場受付" : "operation")
      + "画面をURLから判別しました。PC画面に表示された6桁のPINを入力してください。";
    QR_connection_status.style.color = "#8a5a00";
    QR_pin_status.textContent =
      "PINが設定されるまで、読み取ったデータは送信されません。";
    QR_pin_status.style.color = "#8a5a00";
  }

  QR_showSendStatus(
    QR_hasValidPairingCode()
      ? "QRコードの読み取りを開始してください。"
      : "PINを設定してからQRコードを読み取ってください。",
    QR_hasValidPairingCode() ? "black" : "#8a5a00"
  );

  return true;
}


function QR_applyReaderMode()
{
  if(
    QR_reader_mode === "register"
  )
  {
    if(QR_reader_notice !== null)
    {
      QR_reader_notice.textContent =
        "利用者登録に使用するQRコードを"
        + "読み取ってください。\n"
        + "仮登録QRコード、QRカードの"
        + "どちらも読み取れます。";
    }

    if(QR_last_scan_id !== null)
    {
      QR_last_scan_id.style.fontSize =
        "16px";

      QR_last_scan_id.style.letterSpacing =
        "1px";

      QR_last_scan_id.style.wordBreak =
        "break-all";

      QR_last_scan_id.style.overflowWrap =
        "anywhere";
    }
  }
  else if(
    QR_reader_mode === "visit"
  )
  {
    if(QR_reader_notice !== null)
    {
      QR_reader_notice.textContent =
        "入場受付用のQRコードを"
        + "読み取ってください。\n"
        + "QRカード、ID形式のQRの"
        + "どちらも読み取れます。";
    }
  }
  else
  {
    if(QR_reader_notice !== null)
    {
      QR_reader_notice.textContent =
        "利用者のQRコードを読み取ってください。"
        + "正しい形式のユーザーIDを読み取ると、"
        + "operation画面へ送信します。"
        + "QRを読み取っただけでは、"
        + "STARの加算や減算は実行されません。";
    }
  }
}


function QR_hasValidConnection()
{
  if(
    QR_receiver_url === ""
    ||
    QR_session_id === ""
    ||
    !/^[a-z0-9_-]{3,40}$/
      .test(
        QR_station_id_value
      )
  )
  {
    return false;
  }

  return true;
}


function QR_hasValidPairingCode()
{
  return /^\d{6}$/.test(
    QR_pairing_code_value
  );
}


/*
 * PINだけでの遅れ接続(RESCUE接続)に
 * 使う受信側URLの候補。
 * (ページURLに接続情報が無い場合も
 *  PINさえあればPCと接続できる)
 */
let QR_connectionAttempt_ = 0;
async function QR_connectWithPin() {
  const attempt = ++QR_connectionAttempt_;
  QR_prepareFeedback_();
  const pin = String(QR_pairing_code_input.value || '').trim();
  if (!/^\d{6}$/.test(pin)) { QR_pin_status.textContent = 'PINは6桁の数字で入力してください。'; return; }
  QR_connection_valid = false;
  QR_pin_status.textContent = '接続先を確認しています…';
  try {
    const params = new URLSearchParams(window.location.search);
    let urls = [];
    try { urls = JSON.parse(params.get('resolverUrls') || '[]'); } catch (_) {}
    if (!Array.isArray(urls)) urls = [];
    if (QR_receiver_url) urls.unshift(QR_receiver_url);
    if (!urls.length) {
      const config = await fetch('./connections.json', {cache: 'no-store'});
      urls = await config.json();
    }
    urls = [...new Set(urls)].filter(QR_isAllowedReceiverUrl).slice(0, 4);
    const results = await Promise.all(urls.map(async url => {
      try {
        const result = await QR_postJson(url, {action: 'resolveConnection', pairingCode: pin});
        return (result.ok === true || result.success === true) && result.sessionId ? result : null;
      } catch (_) { return null; }
    }));
    if (attempt !== QR_connectionAttempt_) return;
    const matches = results.filter(Boolean).filter((r, i, all) => all.findIndex(x => x && x.sessionId === r.sessionId) === i);
    if (matches.length !== 1) throw new Error(matches.length ? '同じPINの接続が複数あります。PCで接続し直してください。' : '有効なPINが見つかりません。PINの期限と公開設定を確認してください。');
    const match = matches[0];
    if (!QR_isAllowedReceiverUrl(match.receiverUrl) || !/^[a-z0-9_-]{3,40}$/i.test(match.stationId)) throw new Error('接続情報が正しくありません。');
    QR_receiver_url = match.receiverUrl;
    QR_session_id = match.sessionId;
    QR_station_id_value = match.stationId;
    QR_reader_mode = match.pageType === 'register' ? 'register' : match.pageType === 'operation' ? 'operation' : 'visit';
    QR_pairing_code_value = pin;
    QR_pairing_code.textContent = pin;
    QR_station_id.textContent = match.stationId;
    QR_applyReaderMode();
    QR_connection_valid = true;
    QR_connection_status.textContent = ({register: '利用者登録', operation: 'STAR操作', visit_in: '入場受付', visit_out: '退場受付', visit: '入退場受付'}[match.pageType] || '入退場受付') + 'に接続しました。';
    QR_connection_status.style.color = 'black';
    QR_pin_status.textContent = 'QRコードを読み取ってください。';
  } catch (error) { if (attempt === QR_connectionAttempt_) { QR_pin_status.textContent = error.message; QR_pin_status.style.color = 'red'; } }
}


function QR_isAllowedReceiverUrl(
  receiverUrl
)
{
  try
  {
    const receiver =
      new URL(
        receiverUrl
      );

    if(
      receiver.protocol
      !== "https:"
    )
    {
      return false;
    }

    const allowedHosts = [
      "script.google.com",
      "script.googleusercontent.com"
    ];

    if(
      !allowedHosts.includes(
        receiver.hostname
      )
    )
    {
      return false;
    }

    if(
      receiver.hostname
        === "script.google.com"
      &&
      !receiver.pathname.startsWith(
        "/macros/"
      )
    )
    {
      return false;
    }

    return true;
  }
  catch(error)
  {
    console.error(
      "[QR receiver URL]",
      error
    );

    return false;
  }
}


// ==================================================
// 登録モードQR判定
// ==================================================

function QR_normalizeRegisterPayload(
  payload
)
{
  return String(
    payload || ""
  )
    .trim()
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    )
    .trim();
}


function QR_isValidRegisterPayload(
  payload
)
{
  const normalizedPayload =
    QR_normalizeRegisterPayload(
      payload
    );

  /*
   * ID単体のQR(U/S/A/T)も
   * 登録モードで受け付ける
   * (A00-00000形式のスキャンも可能にする)。
   */
  if(
    QR_QRcode_reader_user_id_check_text
      .test(
        normalizedPayload.toUpperCase()
      )
  )
  {
    return true;
  }

  if(
    QR_QRcode_reader_user_id_check_text.test(normalizedPayload.toUpperCase()) ||
    /^1SCJ\|staff\|[SA]\d{2}-\d{5}\|[0-9a-f]{64}$/i.test(normalizedPayload) ||
    QR_QRcode_reader_pre_id_check_text
      .test(
        normalizedPayload.toUpperCase()
      )
  )
  {
    return true;
  }

  if(
    QR_QRcode_reader_qr_card_check_text
      .test(
        normalizedPayload
      )
  )
  {
    return true;
  }

  /*
   * スタッフQRカードも受け付ける
   * (target=operatorでスキャン時、
   *  受付ページが担当者設定に使う)。
   */
  if(
    QR_QRcode_reader_staff_card_check_text
      .test(
        normalizedPayload
      )
  )
  {
    return true;
  }

  return false;
}


// ==================================================
// 読取成功
// ==================================================

function QR_QRcode_reader_onScanSuccess(
  decodedText
)
{
  const normalizedText =
    QR_normalizeRegisterPayload(
      decodedText
    );

  const comparisonText =
    normalizedText.toUpperCase();

  const now =
    Date.now();

  if(
    comparisonText
      === QR_QRcode_reader_last_id
    &&
    now
      - QR_QRcode_reader_last_time
      < QR_QRcode_reader_duplicate_wait
  )
  {
    return;
  }

  QR_QRcode_reader_last_id =
    comparisonText;

  QR_QRcode_reader_last_time =
    now;

  if(
    normalizedText === ""
  )
  {
    return;
  }

  if (QR_reader_mode === 'operation') {
    const accepted = /^[USAT]\d{2}-\d{5}$/i.test(normalizedText) ||
      /^(?:1SCJ\|user\|)?[UT]\d{2}-\d{5}\|[0-9a-f]{64}$/i.test(normalizedText) ||
      /^1SCJ\|staff\|[SA]\d{2}-\d{5}\|[0-9a-f]{64}$/i.test(normalizedText);
    if (!accepted) { QR_showSendStatus('利用者またはスタッフのQRカードを読み取ってください。', 'red'); return; }
    QR_QRcode_reader_result_text = normalizedText;
    QR_showLastScan(normalizedText);
    QR_sendScannedPayload(normalizedText, false);
    return;
  }
  if(
    QR_reader_mode === "visit"
  )
  {
    const isVisitUserId =
      QR_QRcode_reader_user_id_check_text.test(
        comparisonText
      );

    const isStaffCard = /^1SCJ\|staff\|[SA]\d{2}-\d{5}\|[0-9a-f]{64}$/i.test(normalizedText);
    const isVisitCard =
      QR_QRcode_reader_qr_card_check_text.test(
        normalizedText
      );

    if(
      !isVisitUserId && !isStaffCard
      &&
      !isVisitCard
    )
    {
      QR_QRcode_reader_result.textContent =
        "読み取り結果：Error："
        + "入場受付で使えるQRコードではありません。";

      QR_QRcode_reader_result.style.color =
        "red";

      QR_flashReader(false);
      QR_alert(false);

      QR_QRcode_reader_result_text =
        null;

      QR_showSendStatus(
        "QRカードかID形式のQRを読み取ってください。",
        "red"
      );

      return;
    }

    QR_QRcode_reader_result_text =
      normalizedText;

    QR_QRcode_reader_result.textContent =
      "読み取り結果："
      + QR_describePayload_(normalizedText);

    QR_QRcode_reader_result.style.color =
      "green";


    QR_showLastScan(
      normalizedText
    );

    QR_sendScannedPayload(
      normalizedText,
      false
    );

    console.log(
      "[QR visit scan success]",
      QR_describePayload_(normalizedText)
    );

    return;
  }

  if(
    !QR_isValidRegisterPayload(
      normalizedText
    )
  )
  {
    QR_QRcode_reader_result.textContent =
      "読み取り結果：Error："
      + "利用者登録に使用できるQRコードではありません。";

    QR_QRcode_reader_result.style.color =
      "red";

    QR_flashReader(false);
    QR_alert(false);

    QR_QRcode_reader_result_text =
      null;

    QR_showSendStatus(
      "仮登録はP00-00000、ID単体はU/S/A/T00-00000形式です。"
      + "利用者カードはU00-00000|64文字の16進数Hash"
      + "（旧形式1SCJ|user|ID|Hashも可）、"
      + "スタッフカードは1SCJ|staff|S00-00000|64文字の16進数鍵です。",
      "red"
    );

    return;
  }

  /*
   * ID単体のQRは大文字化して送る
   * (サーバー側の形式チェックが大文字前提)。
   * QRカードの鍵(hex)は大小を保持する。
   */
  let registerSendText =
    normalizedText;

  if(
    QR_QRcode_reader_user_id_check_text.test(
      normalizedText.toUpperCase()
    )
  )
  {
    registerSendText =
      normalizedText.toUpperCase();
  }

  QR_QRcode_reader_result_text =
    registerSendText;

  QR_QRcode_reader_result.textContent =
    "読み取り結果："
    + QR_describePayload_(normalizedText);

  QR_QRcode_reader_result.style.color =
    "green";


  QR_showLastScan(
    registerSendText
  );

  QR_sendScannedPayload(
    registerSendText,
    false
  );

  console.log(
    "[QR register scan success]",
    QR_describePayload_(normalizedText)
  );
}


// ==================================================
// GASへの送信
// ==================================================

async function QR_sendScannedPayload(
  rawPayload,
  forceSend
)
{
  const payload =
    String(
      rawPayload || ""
    ).trim();

  if(payload === "")
  {
    QR_showSendStatus(
      "送信できるQRデータがありません。",
      "red"
    );

    return;
  }

  if(!QR_connection_valid)
  {
    QR_showSendStatus(
      "PCとの接続が確立されていません。\n"
      + "接続元の画面から接続URLを作り直してください。",
      "red"
    );

    return;
  }

  if(!QR_hasValidConnection())
  {
    QR_showSendStatus(
      "PCとの接続情報が不足しています。",
      "red"
    );

    return;
  }

  if(!QR_hasValidPairingCode())
  {
    QR_showSendStatus(
      "先に6桁のPINを入力して「PINを設定」を押してください。",
      "red"
    );
    return;
  }

  if(
    !QR_isAllowedReceiverUrl(
      QR_receiver_url
    )
  )
  {
    QR_showSendStatus(
      "GASの送信先URLが正しくありません。",
      "red"
    );

    return;
  }

  if(QR_send_busy)
  {
    return;
  }

  const now =
    Date.now();

  if(
    forceSend !== true
    &&
    payload === QR_last_sent_payload
    &&
    now
      - QR_last_sent_time
      < QR_send_duplicate_wait
  )
  {
    return;
  }

  if(
    QR_send_form === null
    ||
    QR_send_session_id === null
    ||
    QR_send_station_id === null
    ||
    QR_send_pairing_code === null
    ||
    QR_send_payload === null
    ||
    QR_send_source === null
  )
  {
    QR_showSendStatus(
      "送信用フォームが見つかりません。",
      "red"
    );

    return;
  }

  QR_send_busy =
    true;

  QR_last_sent_payload =
    payload;

  QR_last_sent_time =
    now;

  QR_send_form.action =
    QR_receiver_url;

  QR_send_session_id.value =
    QR_session_id;

  QR_send_station_id.value =
    QR_station_id_value;

  QR_send_pairing_code.value =
    QR_pairing_code_value;

  QR_send_payload.value =
    payload;

  QR_send_source.value =
    QR_source;

  QR_resend_button.disabled =
    true;

  QR_showSendStatus(
    "QRデータをPCへ送信しています...",
    "black"
  );

  try
  {
    const response = await QR_postJson(QR_receiver_url, {action: 'submitScan', sessionId: QR_session_id,
      stationId: QR_station_id_value, pairingCode: QR_pairing_code_value, payload: payload, userId: payload, source: QR_source});
    if (response.success !== true) throw new Error(response.error || response.message || '受信先で拒否されました。');
    QR_notifyScanAccepted_();

    QR_showSendStatus(
      "QRデータをPCへ送信しました。",
      "green"
    );

    QR_showLastScan(
      payload
    );
  }
  catch(error)
  {
    console.error(
      "[QR send scan]",
      error
    );

    QR_showSendStatus(
      "送信を確認できません。" + error.message,
      "red"
    );
  }
  finally
  {
    window.setTimeout(
      function()
      {
        QR_send_busy =
          false;

        if(
          QR_QRcode_reader_result_text
        )
        {
          QR_resend_button.disabled =
            false;
        }
      },
      QR_send_unlock_wait
    );
  }
}


function QR_showSendStatus(
  text,
  color
)
{
  if(QR_send_status === null)
  {
    return;
  }

  QR_send_status.textContent =
    text;

  QR_send_status.style.color =
    color;
}


function QR_showLastScan(
  payload
)
{
  if(
    QR_last_scan_area === null
    ||
    QR_last_scan_id === null
    ||
    QR_resend_button === null
  )
  {
    return;
  }

  QR_last_scan_id.textContent =
    QR_describePayload_(payload);

  QR_last_scan_area.style.display =
    "block";

  QR_resend_button.disabled =
    QR_send_busy;
}


function QR_resendLastScan()
{
  if(
    !QR_QRcode_reader_result_text
  )
  {
    QR_showSendStatus(
      "再送信できる読取結果がありません。",
      "red"
    );

    return;
  }

  QR_sendScannedPayload(
    QR_QRcode_reader_result_text,
    true
  );
}


function QR_resetResult()
{
  QR_QRcode_reader_result_text =
    null;

  QR_QRcode_reader_last_id =
    null;

  QR_QRcode_reader_last_time =
    0;

  QR_last_sent_payload =
    "";

  QR_last_sent_time =
    0;

  QR_QRcode_reader_result.textContent =
    "読み取り結果：対象QRコードをかざしてください。";

  QR_QRcode_reader_result.style.color =
    "black";

  QR_send_status.textContent =
    "";

  QR_last_scan_id.textContent =
    "";

  QR_last_scan_area.style.display =
    "none";

  QR_resend_button.disabled =
    true;
}


// ==================================================
// カメラ一覧
// ==================================================

async function QR_QRcode_reader_loadCameras()
{
  QR_QRcode_reader_camera_select.disabled =
    true;

  QR_QRcode_reader_camera_reload_button.disabled =
    true;

  QR_QRcode_reader_button.disabled =
    true;

  QR_QRcode_reader_camera_status.textContent =
    "カメラ一覧を検出しています。";

  try
  {
    const cameras =
      await Html5Qrcode.getCameras();

    QR_QRcode_reader_camera_select.innerHTML =
      "";

    const defaultOption =
      document.createElement(
        "option"
      );

    defaultOption.value =
      "";

    defaultOption.textContent =
      "カメラを選択してください";

    QR_QRcode_reader_camera_select
      .appendChild(
        defaultOption
      );

    if(cameras.length === 0)
    {
      QR_QRcode_reader_camera_status.textContent =
        "使用できるカメラが見つかりませんでした。";

      return;
    }

    cameras.forEach(
      function(camera, index)
      {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          camera.id;

        option.textContent =
          camera.label
          ||
          "カメラ"
          + (index + 1);

        QR_QRcode_reader_camera_select
          .appendChild(
            option
          );
      }
    );

    QR_QRcode_reader_camera_status.textContent =
      cameras.length
      + "台のカメラを検出しました。";

    QR_QRcode_reader_button.disabled =
      false;

    if(cameras.length === 1)
    {
      QR_QRcode_reader_camera_select.value =
        cameras[0].id;
    }
    else
    {
      const preferredCamera =
        QR_findPreferredCamera(
          cameras
        );

      if(preferredCamera !== null)
      {
        QR_QRcode_reader_camera_select.value =
          preferredCamera.id;
      }
    }
  }
  catch(error)
  {
    console.error(
      "[load cameras]",
      error
    );

    QR_QRcode_reader_camera_status.textContent =
      "カメラを取得できませんでした。\n"
      + "カメラの使用を許可してください。";
  }
  finally
  {
    QR_QRcode_reader_camera_reload_button.disabled =
      false;

    QR_QRcode_reader_camera_select.disabled =
      QR_QRcode_reader_camera_on_off;
  }
}


function QR_findPreferredCamera(
  cameras
)
{
  const backCameraWords = [
    "back",
    "rear",
    "environment",
    "背面",
    "外側"
  ];

  for(const camera of cameras)
  {
    const label =
      String(
        camera.label
        || ""
      )
        .trim()
        .toLowerCase();

    if(
      backCameraWords.some(
        function(word)
        {
          return label.includes(
            word
          );
        }
      )
    )
    {
      return camera;
    }
  }

  if(cameras.length > 0)
  {
    return cameras[
      cameras.length - 1
    ];
  }

  return null;
}


// ==================================================
// カメラ開始・停止
// ==================================================

async function QR_QRcode_reader_Scanner_on_off()
{
  if(QR_QRcode_reader_stopping)
  {
    return;
  }

  QR_QRcode_reader_button.disabled =
    true;

  QR_QRcode_reader_camera_select.disabled =
    true;

  QR_QRcode_reader_camera_reload_button.disabled =
    true;

  if(!QR_QRcode_reader_camera_on_off)
  {
    await QR_QRcode_reader_startCamera();

    return;
  }

  await QR_QRcode_reader_stopCamera(
    false
  );
}


async function QR_QRcode_reader_startCamera()
{
  const selectedCameraId =
    QR_QRcode_reader_camera_select.value;

  if(selectedCameraId === "")
  {
    QR_QRcode_reader_camera_status.textContent =
      "使用するカメラを選択してください。";

    QR_QRcode_reader_camera_select.disabled =
      false;

    QR_QRcode_reader_camera_reload_button.disabled =
      false;

    QR_QRcode_reader_button.disabled =
      false;

    return;
  }

  QR_QRcode_reader_scanner =
    new Html5Qrcode(
      "QR_QRcode_reader"
    );

  try
  {
    await QR_QRcode_reader_scanner.start(
      selectedCameraId,
      {
        fps:
          12,

        qrbox:
          function(
            viewfinderWidth,
            viewfinderHeight
          )
          {
            const availableSize =
              Math.min(
                viewfinderWidth,
                viewfinderHeight
              );

            const size =
              Math.min(
                250,
                Math.floor(
                  availableSize
                  * 0.7
                )
              );

            return {
              width:
                size,

              height:
                size
            };
          }
      },
      QR_QRcode_reader_onScanSuccess
    );

    QR_QRcode_reader_camera_on_off =
      true;

    QR_QRcode_reader_button.textContent =
      "読み取り停止　＊カメラ稼働中";

    QR_QRcode_reader_camera_status.textContent =
      "カメラを起動しました。";

    QR_QRcode_reader_button.disabled =
      false;

    QR_QRcode_reader_camera_select.disabled =
      true;

    QR_QRcode_reader_camera_reload_button.disabled =
      true;
  }
  catch(error)
  {
    console.error(
      "[camera start]",
      error
    );

    QR_showCameraStartError(
      error
    );

    if(QR_QRcode_reader_scanner !== null)
    {
      try
      {
        QR_QRcode_reader_scanner.clear();
      }
      catch(clearError)
      {
        console.warn(
          "[camera start cleanup]",
          clearError
        );
      }
    }

    QR_QRcode_reader_scanner =
      null;

    QR_QRcode_reader_camera_on_off =
      false;

    QR_QRcode_reader_button.textContent =
      "読み取り開始　＊カメラ停止中";

    QR_QRcode_reader_button.disabled =
      false;

    QR_QRcode_reader_camera_select.disabled =
      false;

    QR_QRcode_reader_camera_reload_button.disabled =
      false;
  }
}


function QR_showCameraStartError(
  error
)
{
  const errorName =
    error
    &&
    error.name
      ? error.name
      : "UnknownError";

  const errorDetail =
    error
    &&
    error.message
      ? error.message
      : String(error);

  if(
    errorName === "NotAllowedError"
    ||
    errorDetail.includes(
      "NotAllowedError"
    )
    ||
    errorDetail.includes(
      "Permission denied"
    )
  )
  {
    QR_QRcode_reader_camera_status.textContent =
      "カメラの使用が許可されていません。\n"
      + "ブラウザのカメラ権限を許可してください。\n"
      + "エラーコード："
      + errorName;

    return;
  }

  if(
    errorName === "NotFoundError"
    ||
    errorDetail.includes(
      "NotFoundError"
    )
  )
  {
    QR_QRcode_reader_camera_status.textContent =
      "使用できるカメラが見つかりません。\n"
      + "カメラの接続状態を確認してください。\n"
      + "エラーコード："
      + errorName;

    return;
  }

  if(
    errorName === "NotReadableError"
    ||
    errorDetail.includes(
      "NotReadableError"
    )
    ||
    errorDetail.includes(
      "Could not start video source"
    )
  )
  {
    QR_QRcode_reader_camera_status.textContent =
      "カメラを使用できません。\n"
      + "他のアプリやブラウザが"
      + "カメラを使用していないか確認してください。\n"
      + "エラーコード："
      + errorName;

    return;
  }

  if(
    errorName === "OverconstrainedError"
    ||
    errorDetail.includes(
      "OverconstrainedError"
    )
  )
  {
    QR_QRcode_reader_camera_status.textContent =
      "選択したカメラを使用できません。\n"
      + "別のカメラを選択してください。\n"
      + "エラーコード："
      + errorName;

    return;
  }

  QR_QRcode_reader_camera_status.textContent =
    "カメラを起動できませんでした。\n"
    + "エラーコード："
    + errorName
    + "\nエラー詳細："
    + errorDetail;
}


async function QR_QRcode_reader_stopCamera(
  resetResult
)
{
  if(QR_QRcode_reader_stopping)
  {
    return;
  }

  QR_QRcode_reader_stopping =
    true;

  QR_QRcode_reader_button.disabled =
    true;

  const scanner =
    QR_QRcode_reader_scanner;

  try
  {
    if(scanner !== null)
    {
      try
      {
        await scanner.stop();
      }
      catch(stopError)
      {
        console.warn(
          "[camera stop]",
          stopError
        );

        QR_QRcode_reader_forceStopTracks();
      }

      try
      {
        scanner.clear();
      }
      catch(clearError)
      {
        console.warn(
          "[camera clear]",
          clearError
        );
      }
    }

    const readerElement =
      document.getElementById(
        "QR_QRcode_reader"
      );

    if(readerElement !== null)
    {
      readerElement.replaceChildren();
    }

    QR_QRcode_reader_scanner =
      null;

    QR_QRcode_reader_camera_on_off =
      false;

    QR_QRcode_reader_last_id =
      null;

    QR_QRcode_reader_last_time =
      0;

    QR_QRcode_reader_button.textContent =
      "読み取り開始　＊カメラ停止中";

    QR_QRcode_reader_camera_status.textContent =
      "カメラを停止しました。";

    if(resetResult === true)
    {
      QR_resetResult();
    }
  }
  catch(error)
  {
    console.error(
      "[camera stop]",
      error
    );

    QR_QRcode_reader_forceStopTracks();

    QR_QRcode_reader_scanner =
      null;

    QR_QRcode_reader_camera_on_off =
      false;

    QR_QRcode_reader_button.textContent =
      "読み取り開始　＊カメラ停止中";

    QR_QRcode_reader_camera_status.textContent =
      "カメラを強制停止しました。";
  }
  finally
  {
    QR_QRcode_reader_stopping =
      false;

    QR_QRcode_reader_button.disabled =
      false;

    QR_QRcode_reader_camera_select.disabled =
      false;

    QR_QRcode_reader_camera_reload_button.disabled =
      false;
  }
}


function QR_QRcode_reader_forceStopTracks()
{
  const videos =
    document.querySelectorAll(
      "#QR_QRcode_reader video"
    );

  videos.forEach(
    function(video)
    {
      const stream =
        video.srcObject;

      if(
        stream
        &&
        typeof stream.getTracks
          === "function"
      )
      {
        stream.getTracks()
          .forEach(
            function(track)
            {
              try
              {
                track.stop();
              }
              catch(trackError)
              {
                console.warn(
                  "[QR camera force stop track]",
                  trackError
                );
              }
            }
          );
      }

      try
      {
        video.srcObject =
          null;
      }
      catch(srcObjectError)
      {
        console.warn(
          "[QR camera force clear srcObject]",
          srcObjectError
        );
      }
    }
  );
}


// ==================================================
// 初期化
// ==================================================

function QR_initialize()
{
  for (const kind of ['sound','vibration']) {
    const input = document.getElementById('QR_feedback_' + kind);
    if (!input) continue;
    try { input.checked = localStorage.getItem('QR_feedback_' + kind) !== 'false'; } catch (_) {}
    input.addEventListener('change', function() {
      try { localStorage.setItem('QR_feedback_' + kind, String(input.checked)); } catch (_) {}
    });
  }
  QR_QRcode_reader_button.textContent =
    "読み取り開始　＊カメラ停止中";

  QR_QRcode_reader_result.style.color =
    "black";

  QR_QRcode_reader_camera_status.textContent =
    "カメラ情報を取得しています。";

  QR_last_scan_area.style.display =
    "none";

  QR_resend_button.disabled =
    true;

  QR_loadConnection();

  void QR_QRcode_reader_loadCameras();
}


// ==================================================
// イベント登録
// ==================================================

QR_QRcode_reader_button.addEventListener(
  "click",
  function()
  {
    QR_prepareFeedback_();
    void QR_QRcode_reader_Scanner_on_off();
  }
);


QR_QRcode_reader_camera_reload_button
  .addEventListener(
    "click",
    function()
    {
      void QR_QRcode_reader_loadCameras();
    }
  );


if(QR_connect_pin_button !== null)
{
  QR_connect_pin_button.addEventListener(
    "click",
    QR_connectWithPin
  );
}

if(QR_pairing_code_input !== null)
{
  QR_pairing_code_input.addEventListener(
    "keydown",
    function(event)
    {
      if(event.key === "Enter")
      {
        event.preventDefault();
        QR_connectWithPin();
      }
    }
  );
}

if(QR_reader_mode_select !== null)
{
  QR_reader_mode_select.addEventListener(
    "change",
    function()
    {
      const changedMode =
        String(
          QR_reader_mode_select.value || ""
        ).trim();

      if(
        changedMode ===
        ""
      )
      {
        return;
      }

      QR_reader_mode =
        changedMode;

      QR_applyReaderMode();

      if(
        QR_pairing_code_area !== null
      )
      {
        QR_pairing_code_area.style.display =
          (changedMode === "register" || changedMode === "visit")
            ? ""
            : "none";
      }

      /*
       * PINが入力済みなら
       * 切り替え先で再照会する。
       */
      if(QR_hasValidPairingCode())
      {
        QR_pin_status.textContent =
          "接続先を切り替えました。接続情報を再取得しています...";
        QR_pin_status.style.color = "#8a5a00";

        void QR_connectWithPin();
      }
    }
  );
}

QR_resend_button.addEventListener(
  "click",
  QR_resendLastScan
);


QR_reset_result_button.addEventListener(
  "click",
  QR_resetResult
);


window.addEventListener(
  "pagehide",
  function()
  {
    if(
      QR_QRcode_reader_scanner
        !== null
      &&
      QR_QRcode_reader_camera_on_off
      &&
      !QR_QRcode_reader_stopping
    )
    {
      void QR_QRcode_reader_stopCamera(
        false
      );
    }
  }
);


QR_initialize();

async function QR_postJson(url, data) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {method: 'POST', body: new URLSearchParams(data), signal: controller.signal, credentials: 'omit'});
    if (!response.ok) throw new Error('HTTP ' + response.status + '（公開設定を確認）');
    return await response.json();
  } finally { clearTimeout(timer); console.info('[QR request ms]', Math.round(performance.now() - started)); }
}

let QR_audioContext_ = null;
function QR_describePayload_(payload) {
  const text = String(payload || '');
  const staff = /^1SCJ\|staff\|([SA]\d{2}-\d{5})\|/i.exec(text);
  if (staff) return 'スタッフカード：' + staff[1].toUpperCase();
  const user = /^(?:1SCJ\|user\|)?([UT]\d{2}-\d{5})\|/i.exec(text);
  return user ? '利用者カード：' + user[1].toUpperCase() : text;
}
function QR_prepareFeedback_() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (Audio && !QR_audioContext_) QR_audioContext_ = new Audio();
    if (QR_audioContext_ && QR_audioContext_.state === 'suspended') void QR_audioContext_.resume().catch(function() {});
  } catch (_) { /* Reading and delivery must work without sound support. */ }
}
function QR_notifyScanAccepted_() {
  QR_flashReader(true);
  try {
    if (document.getElementById('QR_feedback_vibration')?.checked && typeof navigator.vibrate === 'function') navigator.vibrate(80);
    if (!document.getElementById('QR_feedback_sound')?.checked || !QR_audioContext_ || QR_audioContext_.state !== 'running') return;
    const tone = QR_audioContext_.createOscillator(), gain = QR_audioContext_.createGain();
    tone.frequency.value = 880; gain.gain.value = 0.04;
    tone.connect(gain); gain.connect(QR_audioContext_.destination);
    tone.start(); tone.stop(QR_audioContext_.currentTime + 0.08);
  } catch (_) { /* Device feedback is optional; server acknowledgement remains visible. */ }
}

// ==================================================
// 枠色とアラート(音・バイブ)
// ==================================================

let QR_flashReader_timer =
  null;

let QR_alert_audio_context =
  null;


/**
 * 読み取り結果をカメラ枠の色で伝える。
 * 成功=緑 / 失敗=赤。0.8秒で元に戻す。
 */
function QR_flashReader(
  success
)
{
  const cameraBox =
    document.getElementById(
      "QR_QRcode_reader"
    );

  if(
    cameraBox === null
  )
  {
    return;
  }

  cameraBox.style.borderColor =
    success
      ? "green"
      : "red";

  if(
    QR_flashReader_timer !== null
  )
  {
    clearTimeout(
      QR_flashReader_timer
    );
  }

  QR_flashReader_timer =
    setTimeout(
      function()
      {
        cameraBox.style.borderColor =
          "#333";
      },
      800
    );
}


/**
 * 成功=高音1回、失敗=低音1回。
 * 大音量にしない(店内BGMや本人装備を
 * 考慮)。振動が使える端末では併用。
 */
function QR_alert(
  success
)
{
  try
  {
    if(
      navigator.vibrate
    )
    {
      navigator.vibrate(
        success
          ? 120
          : [
              100,
              60,
              100
            ]
      );
    }
  }
  catch(error)
  {
    /* 振動はできなくても続行 */
  }

  try
  {
    const audioContext =
      window.AudioContext
      || window.webkitAudioContext;

    if(
      !audioContext
    )
    {
      return;
    }

    if(
      QR_alert_audio_context === null
    )
    {
      QR_alert_audio_context =
        new audioContext();
    }

    if(
      QR_alert_audio_context.state
        === "suspended"
    )
    {
      QR_alert_audio_context
        .resume();
    }

    const oscillator =
      QR_alert_audio_context
        .createOscillator();

    const gain =
      QR_alert_audio_context
        .createGain();

    oscillator.type =
      "sine";

    oscillator.frequency.value =
      success
        ? 1320
        : 440;

    gain.gain.value =
      0.1;

    oscillator.connect(gain);

    gain.connect(
      QR_alert_audio_context.destination
    );

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      QR_alert_audio_context.currentTime
        + 0.25
    );

    oscillator.stop(
      QR_alert_audio_context.currentTime
        + 0.25
    );
  }
  catch(error)
  {
    /* 音はできなくても続行 */
  }
}
