const REGISTER_SCANNER_PAGE_TYPE = "register";

const REGISTER_SCANNER_SESSION_MINUTES = 30;
const REGISTER_SCANNER_SCAN_MINUTES = 2;

const REGISTER_SCANNER_GITHUB_URL =
  "https://odango2.github.io/"
  + "cajino-qr-scanner/";


function g_createRegisterScannerSession(
  stationId,
  operatorId
)
{
  const normalizedStationId =
    String(
      stationId || ""
    )
      .trim()
      .toLowerCase();

  const normalizedOperatorId =
    String(
      operatorId || ""
    )
      .trim()
      .toUpperCase();

  if(
    !/^[a-z0-9_-]{3,40}$/.test(
      normalizedStationId
    )
  )
  {
    throw new Error(
      "端末IDが正しくありません。"
    );
  }

  if(
    !/^[SA]\d{2}-\d{5}$/.test(
      normalizedOperatorId
    )
  )
  {
    throw new Error(
      "担当者IDが正しくありません。"
    );
  }

  const operator =
    g_getOperator(
      normalizedOperatorId
    );

  if(operator === null)
  {
    throw new Error(
      "担当者が見つかりません。"
    );
  }

  const receiverUrl =
    ScriptApp.getService().getUrl();

  if(
    !receiverUrl
    ||
    String(receiverUrl).trim() === ""
  )
  {
    throw new Error(
      "登録用QR受信URLを取得できません。"
    );
  }

  const sheet =
    getRequiredRegisterScannerSheet(
      "scanner_session",
      [
        "sessionId",
        "stationId",
        "pairingCodeHash",
        "pageType",
        "operatorId",
        "createdAt",
        "expiresAt",
        "lastAccessAt",
        "status"
      ]
    );

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    10000
  );

  try
  {
    const now =
      new Date();

    const expiresAt =
      new Date(
        now.getTime()
        +
        REGISTER_SCANNER_SESSION_MINUTES
        *
        60
        *
        1000
      );

    const values =
      sheet
        .getDataRange()
        .getValues();

    for(let i = 1; i < values.length; i++)
    {
      const rowPageType =
        String(
          values[i][3] || ""
        )
          .trim()
          .toLowerCase();

      const rowStationId =
        String(
          values[i][1] || ""
        )
          .trim()
          .toLowerCase();

      const rowStatus =
        String(
          values[i][8] || ""
        )
          .trim()
          .toLowerCase();

      if(
        rowPageType
        === REGISTER_SCANNER_PAGE_TYPE
        &&
        rowStationId
        === normalizedStationId
        &&
        rowStatus
        === "active"
      )
      {
        sheet
          .getRange(
            i + 1,
            9
          )
          .setValue(
            "closed"
          );
      }
    }

    const sessionId =
      Utilities.getUuid();

    const pairingCode =
      String(
        Math.floor(
          100000
          +
          Math.random()
          *
          900000
        )
      );

    const pairingCodeHash =
      createRegisterScannerPairingCodeHash(
        pairingCode
      );

    sheet.appendRow(
      [
        sessionId,
        normalizedStationId,
        pairingCodeHash,
        REGISTER_SCANNER_PAGE_TYPE,
        normalizedOperatorId,
        now,
        expiresAt,
        now,
        "active"
      ]
    );

    const scannerUrl =
      REGISTER_SCANNER_GITHUB_URL
      + "?receiverUrl="
      + encodeURIComponent(
          receiverUrl
        )
      + "&sessionId="
      + encodeURIComponent(
          sessionId
        )
      + "&stationId="
      + encodeURIComponent(
          normalizedStationId
        )
      + "&pairingCode="
      + encodeURIComponent(
          pairingCode
        )
      + "&source=phone"
      + "&readerMode=register";

    return {
      success:
        true,

      sessionId:
        sessionId,

      stationId:
        normalizedStationId,

      pairingCode:
        pairingCode,

      pageType:
        REGISTER_SCANNER_PAGE_TYPE,

      expiresAt:
        expiresAt.toISOString(),

      scannerUrl:
        scannerUrl
    };
  }
  finally
  {
    lock.releaseLock();
  }
}


function g_consumeLatestRegisterScan(
  sessionId,
  stationId,
  operatorId
)
{
  const session =
    findRegisterScannerSessionForOperator(
      sessionId,
      stationId,
      operatorId
    );

  if(session === null)
  {
    throw new Error(
      "登録用QRスキャナー接続が無効です。"
    );
  }

  const sheet =
    getRequiredRegisterScannerSheet(
      "scan_queue",
      [
        "scanId",
        "sessionId",
        "stationId",
        "payload",
        "source",
        "scannedAt",
        "expiresAt",
        "consumedAt",
        "consumedBy",
        "result"
      ]
    );

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    10000
  );

  try
  {
    const values =
      sheet
        .getDataRange()
        .getValues();

    const now =
      new Date();

    for(let i = 1; i < values.length; i++)
    {
      const rowSessionId =
        String(
          values[i][1] || ""
        ).trim();

      const rowStationId =
        String(
          values[i][2] || ""
        ).trim();

      const payload =
        String(
          values[i][3] || ""
        ).trim();

      const consumedAt =
        values[i][7];

      const expiresAt =
        parseRegisterScannerDate(
          values[i][6]
        );

      if(
        rowSessionId
        !== String(sessionId || "").trim()
        ||
        rowStationId
        !== String(stationId || "")
          .trim()
          .toLowerCase()
        ||
        payload === ""
        ||
        consumedAt
        ||
        expiresAt === null
        ||
        expiresAt.getTime()
        <= now.getTime()
      )
      {
        continue;
      }

      sheet
        .getRange(
          i + 1,
          8
        )
        .setValue(
          now
        );

      sheet
        .getRange(
          i + 1,
          9
        )
        .setValue(
          String(
            operatorId || ""
          )
            .trim()
            .toUpperCase()
        );

      sheet
        .getRange(
          i + 1,
          10
        )
        .setValue(
          "consumed"
        );

      return {
        success:
          true,

        hasScan:
          true,

        payload:
          payload,

        source:
          String(
            values[i][4] || ""
          ).trim(),

        scannedAt:
          parseRegisterScannerDate(
            values[i][5]
          )
            ? parseRegisterScannerDate(
                values[i][5]
              ).toISOString()
            : ""
      };
    }

    return {
      success:
        true,

      hasScan:
        false
    };
  }
  finally
  {
    lock.releaseLock();
  }
}


function g_closeRegisterScannerSession(
  sessionId,
  stationId,
  operatorId
)
{
  const session =
    findRegisterScannerSessionForOperator(
      sessionId,
      stationId,
      operatorId
    );

  if(session === null)
  {
    return {
      success:
        true
    };
  }

  const sheet =
    getRequiredRegisterScannerSheet(
      "scanner_session",
      [
        "sessionId",
        "stationId",
        "pairingCodeHash",
        "pageType",
        "operatorId",
        "createdAt",
        "expiresAt",
        "lastAccessAt",
        "status"
      ]
    );

  const values =
    sheet
      .getDataRange()
      .getValues();

  for(let i = 1; i < values.length; i++)
  {
    if(
      String(
        values[i][0] || ""
      ).trim()
      ===
      String(
        sessionId || ""
      ).trim()
    )
    {
      sheet
        .getRange(
          i + 1,
          9
        )
        .setValue(
          "closed"
        );

      return {
        success:
          true
      };
    }
  }

  return {
    success:
      true
  };
}


function doPost(e)
{
  try
  {
    const action =
      String(
        e
        &&
        e.parameter
        &&
        e.parameter.action
          ? e.parameter.action
          : ""
      )
        .trim();

    if(action !== "submitScan")
    {
      return createRegisterScannerJsonResponse({
        success:
          false,

        error:
          "不正な操作です。"
      });
    }

    const sessionId =
      String(
        e.parameter.sessionId
        || ""
      ).trim();

    const stationId =
      String(
        e.parameter.stationId
        || ""
      )
        .trim()
        .toLowerCase();

    const pairingCode =
      String(
        e.parameter.pairingCode
        || ""
      ).trim();

    const payload =
      String(
        e.parameter.payload
        || ""
      ).trim();

    const source =
      normalizeRegisterScannerSource(
        e.parameter.source
      );

    if(
      sessionId === ""
      ||
      !/^[a-z0-9_-]{3,40}$/.test(
        stationId
      )
      ||
      !/^\d{6}$/.test(
        pairingCode
      )
      ||
      payload === ""
    )
    {
      return createRegisterScannerJsonResponse({
        success:
          false,

        error:
          "接続情報またはQRデータが不正です。"
      });
    }

    const session =
      findRegisterScannerSessionByCode(
        sessionId,
        stationId,
        pairingCode
      );

    if(session === null)
    {
      return createRegisterScannerJsonResponse({
        success:
          false,

        error:
          "登録用QRスキャナー接続が無効です。"
      });
    }

    addRegisterScannerQueueItem(
      sessionId,
      stationId,
      payload,
      source
    );

    return createRegisterScannerJsonResponse({
      success:
        true,

      message:
        "QRデータを登録画面へ送信しました。"
    });
  }
  catch(error)
  {
    console.error(
      "[register scanner doPost]",
      error
    );

    return createRegisterScannerJsonResponse({
      success:
        false,

      error:
        error
        &&
        error.message
          ? error.message
          : String(error)
    });
  }
}


function addRegisterScannerQueueItem(
  sessionId,
  stationId,
  payload,
  source
)
{
  const sheet =
    getRequiredRegisterScannerSheet(
      "scan_queue",
      [
        "scanId",
        "sessionId",
        "stationId",
        "payload",
        "source",
        "scannedAt",
        "expiresAt",
        "consumedAt",
        "consumedBy",
        "result"
      ]
    );

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    10000
  );

  try
  {
    const values =
      sheet
        .getDataRange()
        .getValues();

    const now =
      new Date();

    for(let i = values.length - 1; i >= 1; i--)
    {
      const rowSessionId =
        String(
          values[i][1] || ""
        ).trim();

      const rowStationId =
        String(
          values[i][2] || ""
        ).trim();

      const rowPayload =
        String(
          values[i][3] || ""
        ).trim();

      const scannedAt =
        parseRegisterScannerDate(
          values[i][5]
        );

      const consumedAt =
        values[i][7];

      if(
        rowSessionId
        ===
        String(
          sessionId || ""
        ).trim()
        &&
        rowStationId
        ===
        String(
          stationId || ""
        ).trim()
        &&
        rowPayload
        ===
        String(
          payload || ""
        ).trim()
        &&
        !consumedAt
        &&
        scannedAt !== null
        &&
        now.getTime()
        -
        scannedAt.getTime()
        < 3000
      )
      {
        return;
      }
    }

    const expiresAt =
      new Date(
        now.getTime()
        +
        REGISTER_SCANNER_SCAN_MINUTES
        *
        60
        *
        1000
      );

    sheet.appendRow(
      [
        Utilities.getUuid(),
        String(
          sessionId || ""
        ).trim(),
        String(
          stationId || ""
        )
          .trim()
          .toLowerCase(),
        String(
          payload || ""
        ).trim(),
        normalizeRegisterScannerSource(
          source
        ),
        now,
        expiresAt,
        "",
        "",
        "pending"
      ]
    );
  }
  finally
  {
    lock.releaseLock();
  }
}


function findRegisterScannerSessionForOperator(
  sessionId,
  stationId,
  operatorId
)
{
  const sheet =
    getRequiredRegisterScannerSheet(
      "scanner_session",
      [
        "sessionId",
        "stationId",
        "pairingCodeHash",
        "pageType",
        "operatorId",
        "createdAt",
        "expiresAt",
        "lastAccessAt",
        "status"
      ]
    );

  const values =
    sheet
      .getDataRange()
      .getValues();

  const normalizedSessionId =
    String(
      sessionId || ""
    ).trim();

  const normalizedStationId =
    String(
      stationId || ""
    )
      .trim()
      .toLowerCase();

  const normalizedOperatorId =
    String(
      operatorId || ""
    )
      .trim()
      .toUpperCase();

  const now =
    new Date();

  for(let i = 1; i < values.length; i++)
  {
    const currentSessionId =
      String(
        values[i][0] || ""
      ).trim();

    const currentStationId =
      String(
        values[i][1] || ""
      )
        .trim()
        .toLowerCase();

    const currentPageType =
      String(
        values[i][3] || ""
      )
        .trim()
        .toLowerCase();

    const currentOperatorId =
      String(
        values[i][4] || ""
      )
        .trim()
        .toUpperCase();

    const expiresAt =
      parseRegisterScannerDate(
        values[i][6]
      );

    const status =
      String(
        values[i][8] || ""
      )
        .trim()
        .toLowerCase();

    if(
      currentSessionId
      !== normalizedSessionId
      ||
      currentStationId
      !== normalizedStationId
      ||
      currentPageType
      !== REGISTER_SCANNER_PAGE_TYPE
      ||
      currentOperatorId
      !== normalizedOperatorId
    )
    {
      continue;
    }

    if(
      expiresAt === null
      ||
      expiresAt.getTime()
      <= now.getTime()
      ||
      status !== "active"
    )
    {
      if(status === "active")
      {
        sheet
          .getRange(
            i + 1,
            9
          )
          .setValue(
            "expired"
          );
      }

      return null;
    }

    sheet
      .getRange(
        i + 1,
        8
      )
      .setValue(
        now
      );

    return {
      sessionId:
        currentSessionId,

      stationId:
        currentStationId,

      operatorId:
        currentOperatorId,

      expiresAt:
        expiresAt
    };
  }

  return null;
}


function findRegisterScannerSessionByCode(
  sessionId,
  stationId,
  pairingCode
)
{
  const sheet =
    getRequiredRegisterScannerSheet(
      "scanner_session",
      [
        "sessionId",
        "stationId",
        "pairingCodeHash",
        "pageType",
        "operatorId",
        "createdAt",
        "expiresAt",
        "lastAccessAt",
        "status"
      ]
    );

  const values =
    sheet
      .getDataRange()
      .getValues();

  const normalizedSessionId =
    String(
      sessionId || ""
    ).trim();

  const normalizedStationId =
    String(
      stationId || ""
    )
      .trim()
      .toLowerCase();

  const normalizedPairingCode =
    String(
      pairingCode || ""
    ).trim();

  const now =
    new Date();

  const pairingCodeHash =
    createRegisterScannerPairingCodeHash(
      normalizedPairingCode
    );

  for(let i = 1; i < values.length; i++)
  {
    const currentSessionId =
      String(
        values[i][0] || ""
      ).trim();

    const currentStationId =
      String(
        values[i][1] || ""
      )
        .trim()
        .toLowerCase();

    const currentPairingCodeHash =
      String(
        values[i][2] || ""
      ).trim()
        .toLowerCase();

    const currentPageType =
      String(
        values[i][3] || ""
      )
        .trim()
        .toLowerCase();

    const expiresAt =
      parseRegisterScannerDate(
        values[i][6]
      );

    const status =
      String(
        values[i][8] || ""
      )
        .trim()
        .toLowerCase();

    if(
      currentSessionId
      !== normalizedSessionId
      ||
      currentStationId
      !== normalizedStationId
      ||
      currentPairingCodeHash
      !== pairingCodeHash
      ||
      currentPageType
      !== REGISTER_SCANNER_PAGE_TYPE
    )
    {
      continue;
    }

    if(
      expiresAt === null
      ||
      expiresAt.getTime()
      <= now.getTime()
      ||
      status !== "active"
    )
    {
      if(status === "active")
      {
        sheet
          .getRange(
            i + 1,
            9
          )
          .setValue(
            "expired"
          );
      }

      return null;
    }

    sheet
      .getRange(
        i + 1,
        8
      )
      .setValue(
        now
      );

    return {
      sessionId:
        currentSessionId,

      stationId:
        currentStationId,

      expiresAt:
        expiresAt
    };
  }

  return null;
}


function getRequiredRegisterScannerSheet(
  name,
  requiredHeaders
)
{
  const sheet =
    getSheet(
      name
    );

  if(sheet === null)
  {
    throw new Error(
      name
      + "シートが見つかりません。"
    );
  }

  const values =
    sheet
      .getDataRange()
      .getValues();

  if(values.length === 0)
  {
    throw new Error(
      name
      + "シートのヘッダーがありません。"
    );
  }

  const headers =
    values[0].map(
      function(value)
      {
        return String(
          value || ""
        ).trim();
      }
    );

  for(
    const requiredHeader
    of requiredHeaders
  )
  {
    if(
      headers.indexOf(
        requiredHeader
      )
      ===
      -1
    )
    {
      throw new Error(
        name
        + "シートに必要な列「"
        + requiredHeader
        + "」がありません。"
      );
    }
  }

  return sheet;
}


function createRegisterScannerPairingCodeHash(
  pairingCode
)
{
  const bytes =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(
        pairingCode || ""
      ).trim(),
      Utilities.Charset.UTF_8
    );

  return bytes
    .map(
      function(byte)
      {
        const value =
          byte < 0
            ? byte + 256
            : byte;

        return value
          .toString(16)
          .padStart(
            2,
            "0"
          );
      }
    )
    .join("");
}


function normalizeRegisterScannerSource(
  source
)
{
  const value =
    String(
      source || ""
    )
      .trim()
      .toLowerCase();

  if(
    value === "phone"
    ||
    value === "pc_camera"
  )
  {
    return value;
  }

  return "unknown";
}


function parseRegisterScannerDate(
  value
)
{
  if(
    value instanceof Date
    &&
    !isNaN(
      value.getTime()
    )
  )
  {
    return value;
  }

  if(
    value === null
    ||
    value === undefined
    ||
    value === ""
  )
  {
    return null;
  }

  const date =
    new Date(
      value
    );

  if(
    isNaN(
      date.getTime()
    )
  )
  {
    return null;
  }

  return date;
}


function createRegisterScannerJsonResponse(
  object
)
{
  return ContentService
    .createTextOutput(
      JSON.stringify(
        object
      )
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}
