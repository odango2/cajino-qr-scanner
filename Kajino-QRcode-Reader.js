// QRコードリーダー //
// 変数を定義 //
const QR_QRcode_reader_button = document.getElementById("QR_QRcode_reader_button");
const QR_QRcode_reader_result = document.getElementById("QR_QRcode_reader_result");
const QR_QRcode_reader_scanner_text_check_text = /^[USAT]\d{2}-\d{5}$/;
const QR_QRcode_reader_camera_select = document.getElementById("QR_QRcode_reader_camera_select");
const QR_QRcode_reader_camera_reload_button = document.getElementById("QR_QRcode_reader_camera_reload_button");
const QR_QRcode_reader_camera_status = document.getElementById("QR_QRcode_reader_camera_status");
const QR_QRcode_reader_duplicate_wait = 2000;
let QR_QRcode_reader_camera_on_off = false ;
let QR_QRcode_reader_scanner = null ;
let QR_QRcode_reader_last_id = null;
let QR_QRcode_reader_last_time = 0;
let QR_QRcode_reader_result_text ;
let QR_QRcode_reader_stopping = false;
// 関数を作成 //
// 読み取り成功時 //
function QR_QRcode_reader_onScanSuccess(decodedText) {
    const now = Date.now();

    if (
        decodedText === QR_QRcode_reader_last_id &&
        now - QR_QRcode_reader_last_time <
            QR_QRcode_reader_duplicate_wait
    ) {
        return;
    }

    // 成否に関係なく最後に読み取ったQRを記録
    QR_QRcode_reader_last_id = decodedText;
    QR_QRcode_reader_last_time = now;

    if (
        QR_QRcode_reader_scanner_text_check_text.test(decodedText)
    ) {
        QR_QRcode_reader_result.textContent =
            "読み取り結果：" + decodedText;

        QR_QRcode_reader_result_text = decodedText;

        console.log(
            QR_QRcode_reader_result,
            QR_QRcode_reader_result_text
        );
        // QRコード読み取り成功し、形式が正しい場合.
        // 形式が正しいIDは　QR_QRcode_reader_result_text　に文字列として保存される.

    } else {
        QR_QRcode_reader_result.textContent =
            "読み取り結果：Error：形式が異なります";
        QR_QRcode_reader_result_text = null;
    }
}

// カメラ情報を取得
async function QR_QRcode_reader_loadCameras() {
    QR_QRcode_reader_camera_select.disabled = true ;
    QR_QRcode_reader_camera_reload_button.disabled = true;
    QR_QRcode_reader_button.disabled = true;

    QR_QRcode_reader_camera_status.textContent =
        "カメラ一覧を検出.";

    try {

        const cameras =
            await Html5Qrcode.getCameras();

        QR_QRcode_reader_camera_select.innerHTML =
            '<option value="">'
            + 'カメラを選択してください'
            + '</option>';

        if (cameras.length === 0) {

            QR_QRcode_reader_camera_status.textContent =
                "使用できるカメラが見つかりませんでした.";

            QR_QRcode_reader_button.disabled = true;


            return;
        }

        cameras.forEach(function(camera, index) {

            const option =
                document.createElement("option");

            option.value =
                camera.id;

            option.textContent =
                camera.label
                || "カメラ" + (index + 1);

            QR_QRcode_reader_camera_select
                .appendChild(option);
        });

        QR_QRcode_reader_camera_status.textContent =
            cameras.length
            + "台のカメラを検出.";

        // カメラ取得成功
        QR_QRcode_reader_button.disabled = false;

    } catch(error) {

        console.error(
            "[load cameras]",
            error
        );

        QR_QRcode_reader_camera_status.textContent =
            "カメラを取得できませんでした.\n"
            + "カメラの使用を許可してください.";

        QR_QRcode_reader_button.disabled = true;

    } finally {

        QR_QRcode_reader_camera_reload_button.disabled = false;
        QR_QRcode_reader_camera_select.disabled = false ;

    }
}



// ボタンの状態によりカメラ起動停止する //
async function QR_QRcode_reader_Scanner_on_off(){
    QR_QRcode_reader_button.disabled = true;
    QR_QRcode_reader_camera_select.disabled = true;
    QR_QRcode_reader_camera_reload_button.disabled = true;
    if (!QR_QRcode_reader_camera_on_off){
        const selectedCameraId =
        QR_QRcode_reader_camera_select.value;
        if(selectedCameraId === "")
        {
        QR_QRcode_reader_camera_status.textContent =
            "使用するカメラを選択してください.";
        QR_QRcode_reader_camera_select.disabled = false;
        QR_QRcode_reader_camera_reload_button.disabled = false;
        QR_QRcode_reader_button.disabled = false;

        return;
        }
    QR_QRcode_reader_scanner =
        new Html5Qrcode("QR_QRcode_reader");

    try {

        await QR_QRcode_reader_scanner.start(
            selectedCameraId,
            {
                fps: 12,
                qrbox : 
                        function (viewfinderWidth, viewfinderHeight) {
                                const availableSize =
                                    Math.min(viewfinderWidth, viewfinderHeight);

                                const size = Math.min(
                                    250,
                                    Math.floor(availableSize * 0.7)
                                );

                                return {
                                    width: size,
                                    height: size
                                };
                            }
                    
            },
            QR_QRcode_reader_onScanSuccess
        );

        // カメラ起動に成功した場合
        QR_QRcode_reader_camera_on_off = true;
        QR_QRcode_reader_button.textContent = "読み取り停止　＊カメラ稼働中"
        QR_QRcode_reader_camera_status.textContent =
            "カメラを起動しました。";
        await new Promise(resolve => setTimeout(resolve, 500));

    } catch(error) {
        // カメラ起動に失敗した場合
        console.error("[camera start]", error);

        const errorName =
            error && error.name
                ? error.name
                : "UnknownError";

        const errorDetail =
            error && error.message
                ? error.message
                : String(error);

        if (
            errorName === "NotAllowedError"
            || errorDetail.includes("NotAllowedError")
            || errorDetail.includes("Permission denied")
        ) {
            QR_QRcode_reader_camera_status.textContent =
                "カメラの使用が許可されていません.\n"
                + "エラーコード：" + errorName + "\n"
                + "エラー詳細：" + errorDetail + "\n"
                + "ページを再度読み込んでください.";
        }
        else if (
            errorName === "NotFoundError"
            || errorDetail.includes("NotFoundError")
        ) {
            QR_QRcode_reader_camera_status.textContent =
                "使用できるカメラが見つかりません.\n"
                + "エラーコード：" + errorName + "\n"
                + "エラー詳細：" + errorDetail + "\n"
                + "カメラの接続状態を確認してください.";
        }
        else if (
            errorName === "NotReadableError"
            || errorDetail.includes("NotReadableError")
            || errorDetail.includes("Could not start video source")
        ) {
            QR_QRcode_reader_camera_status.textContent =
                "カメラを使用できません.\n"
                + "他のアプリがカメラを使用していないか確認してください.\n"
                + "エラーコード：" + errorName + "\n"
                + "エラー詳細：" + errorDetail;
        }
        else if (
            errorName === "OverconstrainedError"
            || errorDetail.includes("OverconstrainedError")
        ) {
            QR_QRcode_reader_camera_status.textContent =
                "選択したカメラを使用できません.\n"
                + "エラーコード：" + errorName + "\n"
                + "エラー詳細：" + errorDetail +  "\n"
                + "別のカメラを選択してください.";
        }
        else {
            QR_QRcode_reader_camera_status.textContent =
                "カメラを起動できませんでした.\n"
                + "エラーコード：" + errorName + "\n"
                + "エラー詳細：" + errorDetail + "\n"
                + "ページを再度読み込んでください.";
        }

        try {
            QR_QRcode_reader_scanner.clear();
        } catch (clearError) {
            console.warn("[camera start cleanup]", clearError);
        }

        QR_QRcode_reader_scanner = null;
        QR_QRcode_reader_camera_on_off = false;
        QR_QRcode_reader_button.textContent =
            "読み取り開始　＊カメラ停止中";
        QR_QRcode_reader_camera_select.disabled = false;
        QR_QRcode_reader_camera_reload_button.disabled = false;
    }
    finally {

        // 成功・失敗に関係なく実行
        QR_QRcode_reader_button.disabled = false;

    }
    }   
    
    else {
        await QR_QRcode_reader_stopCamera();
    }

};
async function QR_QRcode_reader_stopCamera() {

    if (QR_QRcode_reader_stopping) {
            return;
    }

    QR_QRcode_reader_stopping = true;
    QR_QRcode_reader_button.disabled = true;

    const scanner = QR_QRcode_reader_scanner;

    try {
        if (QR_QRcode_reader_scanner === null) {
            QR_QRcode_reader_camera_on_off = false;
            QR_QRcode_reader_result_text = null;

            QR_QRcode_reader_camera_select.disabled = false;
            QR_QRcode_reader_camera_reload_button.disabled = false;
            QR_QRcode_reader_button.disabled = false;

            QR_QRcode_reader_button.textContent =
                "読み取り開始　＊カメラ停止中";

            QR_QRcode_reader_camera_status.textContent =
                "カメラは停止しています.";
            QR_QRcode_reader_result.textContent =
                "読み取り結果：対象QRコードをかざしてください.";
            return;
        }
        await scanner.stop();

    try {
                scanner.clear();
            } catch (clearError) {
                console.warn("[camera clear]", clearError);
        }

        QR_QRcode_reader_camera_reload_button.disabled = false;
        QR_QRcode_reader_camera_select.disabled = false;
        QR_QRcode_reader_button.disabled = false;

        QR_QRcode_reader_button.textContent =
            "読み取り開始　＊カメラ停止中";

        QR_QRcode_reader_camera_status.textContent =
            "カメラを停止しました.";

        QR_QRcode_reader_last_id = null;
        QR_QRcode_reader_last_time = 0;
        QR_QRcode_reader_scanner = null;
        QR_QRcode_reader_camera_on_off = false;
        QR_QRcode_reader_result_text = null;
        QR_QRcode_reader_result.textContent =
            "読み取り結果：対象QRコードをかざしてください.";

    } catch (error) {

    console.error("[camera stop]", error);

    const errorName =
        error && error.name
            ? error.name
            : "UnknownError";

    const errorDetail =
        error && error.message
            ? error.message
            : String(error);

    QR_QRcode_reader_camera_status.textContent =
        "通常のカメラ停止処理に失敗しました.\n"
        + "強制停止処理を実行しました.\n"
        + "エラーコード：" + errorName + "\n"
        + "エラー詳細：" + errorDetail;
    QR_QRcode_reader_forceStopTracks()

    const readerElement =
    document.getElementById("QR_QRcode_reader");

    if (readerElement !== null) {
        readerElement.replaceChildren();
    }
    QR_QRcode_reader_scanner = null;
    QR_QRcode_reader_camera_on_off = false;
    QR_QRcode_reader_last_id = null;
    QR_QRcode_reader_last_time = 0;
    QR_QRcode_reader_result_text = null;
    QR_QRcode_reader_result.textContent =
    "読み取り結果：対象QRコードをかざしてください.";

     
    QR_QRcode_reader_camera_select.disabled = false;
    QR_QRcode_reader_camera_reload_button.disabled = false;
     
    QR_QRcode_reader_button.textContent =
    "読み取り開始　＊カメラ停止中";
}
finally{
    QR_QRcode_reader_stopping = false;
    QR_QRcode_reader_button.disabled = false;
}
}

function QR_QRcode_reader_forceStopTracks() {
    const videos = document.querySelectorAll(
        "#QR_QRcode_reader video"
    );

    videos.forEach(function(video) {
        const stream = video.srcObject;

        if (stream && typeof stream.getTracks === "function") {
            stream.getTracks().forEach(function(track) {
                try {
                    track.stop();
                } catch (trackError) {
                    console.warn(
                        "[camera force stop track]",
                        trackError
                    );
                }
            });
        }

        try {
                video.srcObject = null;
            } catch (srcObjectError) {
                console.warn(
                    "[camera force clear srcObject]",
                    srcObjectError
                );
        }
    });
}
// 以降 //
// カメラは停止中なので読み取り停止中と表示 //
QR_QRcode_reader_button.textContent = "読み取り開始　＊カメラ停止中" ;

QR_QRcode_reader_loadCameras()

QR_QRcode_reader_button.addEventListener("click" , 
    QR_QRcode_reader_Scanner_on_off
)

QR_QRcode_reader_camera_reload_button.addEventListener("click" , 
    QR_QRcode_reader_loadCameras
)

window.addEventListener("pagehide", function () {
    if (
        QR_QRcode_reader_scanner !== null &&
        QR_QRcode_reader_camera_on_off &&
        !QR_QRcode_reader_stopping
    ) {
        void QR_QRcode_reader_stopCamera();
    }
});
