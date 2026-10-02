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

const QR_send_user_id =
  document.getElementById(
    "QR_send_user_id"
  );

const QR_send_source =
  document.getElementById(
    "QR_send_source"
  );


// ==================================================
// 定数
// ==================================================

const QR_QRcode_reader_scanner_text_check_text =
  /^[USAT]\d{2}-\d{5}$/;

const QR_QRcode_reader_duplicate_wait =
  2000;

const QR_send_duplicate_wait =
  3000;

const QR_send_unlock_wait =
  1500;


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
// operation接続関連の状態
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

let QR_last_sent_user_id =
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

  QR_station_id.textContent =
    QR_station_id_value
    || "未設定";

  QR_pairing_code.textContent =
    QR_pairing_code_value
    || "未設定";

  if(!QR_hasValidConnection())
  {
    QR_connection_valid =
      false;

    QR_connection_status.textContent =
      "PCとの接続情報が不足しています。\n"
      + "operation画面から発行された接続URLを開いてください。";

    QR_connection_status.style.color =
      "red";

    QR_showSendStatus(
      "接続されていないため、読取結果は送信されません。",
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

  QR_connection_status.textContent =
    "PCとの接続情報を読み込みました。\n"
    + "operation画面へ読取結果を送信できます。";

  QR_connection_status.style.color =
    "green";

  QR_showSendStatus(
    "QRコードの読み取りを開始してください。",
    "black"
  );

  return true;
}


function QR_hasValidConnection()
{
  return (
    QR_receiver_url !== ""
    &&
    QR_session_id !== ""
    &&
    /^[a-z0-9_-]{3,40}$/
      .test(
        QR_station_id_value
      )
    &&
    /^\d{6}$/
      .test(
        QR_pairing_code_value
      )
  );
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
// 読取成功
// ==================================================

function QR_QRcode_reader_onScanSuccess(
  decodedText
)
{
  const normalizedText =
    String(decodedText || "")
      .trim()
      .toUpperCase();

  const now =
    Date.now();

  if(
    normalizedText
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
    normalizedText;

  QR_QRcode_reader_last_time =
    now;

  if(
    !QR_QRcode_reader_scanner_text_check_text
      .test(normalizedText)
  )
  {
    QR_QRcode_reader_result.textContent =
      "読み取り結果：Error："
      + "1SシステムのID形式ではありません。";

    QR_QRcode_reader_result.style.color =
      "red";

    QR_QRcode_reader_result_text =
      null;

    QR_showSendStatus(
      "形式が異なるため、PCへ送信していません。",
      "red"
    );

    return;
  }

  QR_QRcode_reader_result_text =
    normalizedText;

  QR_QRcode_reader_result.textContent =
    "読み取り結果："
    + normalizedText;

  QR_QRcode_reader_result.style.color =
    "green";

  QR_showLastScan(
    normalizedText
  );

  QR_sendScannedUserId(
    normalizedText,
    false
  );

  console.log(
    "[QR scan success]",
    normalizedText
  );
}


// ==================================================
// GASへの送信
// ==================================================

function QR_sendScannedUserId(
  rawUserId,
  forceSend
)
{
  const userId =
    String(rawUserId || "")
      .trim()
      .toUpperCase();

  if(
    !QR_QRcode_reader_scanner_text_check_text
      .test(userId)
  )
  {
    QR_showSendStatus(
      "正しい形式のユーザーIDではありません。",
      "red"
    );

    return;
  }

  if(!QR_connection_valid)
  {
    QR_showSendStatus(
      "PCとの接続が確立されていません。\n"
      + "operation画面から接続URLを作り直してください。",
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
    QR_showSendStatus(
      "前の読取結果を送信しています。",
      "black"
    );

    return;
  }

  const now =
    Date.now();

  if(
    forceSend !== true
    &&
    userId
      === QR_last_sent_user_id
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
    QR_send_user_id === null
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

  QR_last_sent_user_id =
    userId;

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

  QR_send_user_id.value =
    userId;

  QR_send_source.value =
    QR_source;

  QR_resend_button.disabled =
    true;

  QR_showSendStatus(
    userId
    + "をPCへ送信しています...",
    "black"
  );

  try
  {
    QR_send_form.submit();

    QR_showSendStatus(
      userId
      + "をPCへ送信しました。\n"
      + "operation画面でユーザーが表示されることを"
      + "確認してください。",
      "green"
    );

    QR_showLastScan(
      userId
    );
  }
  catch(error)
  {
    console.error(
      "[QR send scan]",
      error
    );

    QR_showSendStatus(
      "PCへの送信処理に失敗しました。",
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
  userId
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
    userId;

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

  QR_sendScannedUserId(
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

  QR_last_sent_user_id =
    "";

  QR_last_sent_time =
    0;

  QR_QRcode_reader_result.textContent =
    "読み取り結果：対象QRコードをかざしてください。";

  QR_QRcode_reader_result.style.color =
    "black";

  if(QR_send_status !== null)
  {
    QR_send_status.textContent =
      "";
  }

  if(QR_last_scan_id !== null)
  {
    QR_last_scan_id.textContent =
      "";
  }

  if(QR_last_scan_area !== null)
  {
    QR_last_scan_area.style.display =
      "none";
  }

  if(QR_resend_button !== null)
  {
    QR_resend_button.disabled =
      true;
  }
}


// ==================================================
// カメラ一覧取得
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

      QR_QRcode_reader_button.disabled =
        true;

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

    QR_QRcode_reader_button.disabled =
      true;
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

    QR_QRcode_reader_forceStopTracks();

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
      "通常のカメラ停止処理に失敗しました。\n"
      + "強制停止処理を実行しました。\n"
      + "エラーコード："
      + errorName
      + "\nエラー詳細："
      + errorDetail;
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
                  "[camera force stop track]",
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
          "[camera force clear srcObject]",
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
  QR_QRcode_reader_button.textContent =
    "読み取り開始　＊カメラ停止中";

  QR_QRcode_reader_result.style.color =
    "black";

  QR_QRcode_reader_camera_status.textContent =
    "カメラ情報を取得しています。";

  if(QR_last_scan_area !== null)
  {
    QR_last_scan_area.style.display =
      "none";
  }

  if(QR_resend_button !== null)
  {
    QR_resend_button.disabled =
      true;
  }

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


if(QR_resend_button !== null)
{
  QR_resend_button.addEventListener(
    "click",
    QR_resendLastScan
  );
}


if(QR_reset_result_button !== null)
{
  QR_reset_result_button.addEventListener(
    "click",
    QR_resetResult
  );
}


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
