package com.dipaliwakale.tv

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.TextView
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.io.RandomAccessFile

class MainActivity : Activity() {

    private var webView: WebView? = null
    private val TAG = "DipaliTV"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Keep screen on continuously for kiosk TV display
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            // Asynchronously pre-extract videos to app internal storage for instantaneous range streaming
            Thread {
                preExtractVideos()
            }.start()

            val rootLayout = FrameLayout(this).apply {
                setBackgroundColor(Color.parseColor("#0D0807"))
            }

            val wv = WebView(this).apply {
                setBackgroundColor(Color.parseColor("#0D0807"))
                isFocusable = true
                isFocusableInTouchMode = true

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    allowFileAccessFromFileURLs = true
                    allowUniversalAccessFromFileURLs = true
                    mediaPlaybackRequiresUserGesture = false // Auto-play video reels without requiring user tap
                    cacheMode = WebSettings.LOAD_DEFAULT
                    loadWithOverviewMode = true
                    useWideViewPort = true
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                        Log.d(TAG, "[WebView Console] ${consoleMessage?.message()} (${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()})")
                        return true
                    }
                }
            }

            val assetsHandler = WebViewAssetLoader.AssetsPathHandler(this)

            wv.webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    val uri = request?.url ?: return null
                    if (uri.host == "appassets.androidplatform.net") {
                        var path = uri.path ?: ""
                        while (path.startsWith("/")) {
                            path = path.substring(1)
                        }
                        if (path.isEmpty()) {
                            path = "index.html"
                        }

                        // 1. High-Performance HTTP 206 Partial Content Range streaming for MP4 videos
                        if (path.endsWith(".mp4", ignoreCase = true) || path.endsWith(".webm", ignoreCase = true)) {
                            val videoResponse = handleVideoRangeRequest(path, request)
                            if (videoResponse != null) {
                                return videoResponse
                            }
                        }

                        // 2. Direct AssetsPathHandler for static assets (HTML, CSS, JS, Images, Fonts)
                        try {
                            val res = assetsHandler.handle(path)
                            if (res != null) return res
                        } catch (e: Exception) {
                            Log.v(TAG, "AssetsPathHandler missed direct: $path")
                        }

                        // 3. Nested dist/ fallback
                        try {
                            val distRes = assetsHandler.handle("dist/$path")
                            if (distRes != null) return distRes
                        } catch (e: Exception) {
                            Log.v(TAG, "AssetsPathHandler missed dist: $path")
                        }

                        // 4. Raw asset fallback with explicit MIME type
                        try {
                            val stream = assets.open(path)
                            val mime = getMimeType(path)
                            return WebResourceResponse(mime, "UTF-8", stream)
                        } catch (ignored: Exception) {}

                        try {
                            val stream = assets.open("dist/$path")
                            val mime = getMimeType(path)
                            return WebResourceResponse(mime, "UTF-8", stream)
                        } catch (ignored: Exception) {}
                    }
                    return super.shouldInterceptRequest(view, request)
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    Log.e(TAG, "WebView error on ${request?.url}: ${error?.description} (${error?.errorCode})")
                }
            }

            this.webView = wv
            rootLayout.addView(
                wv,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )

            setContentView(rootLayout)

            // Safely hide system UI after layout is attached
            rootLayout.post { hideSystemUI() }

            // Load offline kiosk directly
            wv.loadUrl("https://appassets.androidplatform.net/index.html?tv=1")
            wv.requestFocus()

        } catch (t: Throwable) {
            Log.e(TAG, "Fatal startup error", t)
            val errorView = TextView(this).apply {
                text = "Dipali Wakale TV - Startup Error:\n\n${t.message}\n\n${t.stackTraceToString()}"
                setTextColor(Color.RED)
                setBackgroundColor(Color.BLACK)
                setPadding(50, 50, 50, 50)
                textSize = 14f
            }
            setContentView(errorView)
        }
    }

    private fun getMediaStorageDir(): File {
        val dir = File(filesDir, "media")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun preExtractVideos() {
        try {
            val list = listOf(
                "instagram/reels/hair-transformation.mp4",
                "instagram/reels/hair-extensions.mp4",
                "instagram/reels/hair-styling.mp4"
            )
            for (p in list) {
                getOrExtractVideoFile(p)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Pre-extract error", e)
        }
    }

    @Synchronized
    private fun getOrExtractVideoFile(relativePath: String): File? {
        val targetFile = File(getMediaStorageDir(), relativePath)
        if (targetFile.exists() && targetFile.length() > 500_000L) {
            return targetFile
        }
        targetFile.parentFile?.mkdirs()

        return try {
            val assetStream = try {
                assets.open(relativePath)
            } catch (e: Exception) {
                assets.open("dist/$relativePath")
            }
            val tempFile = File(targetFile.parentFile, "${targetFile.name}.tmp")
            assetStream.use { input ->
                tempFile.outputStream().use { output ->
                    input.copyTo(output, bufferSize = 128 * 1024)
                }
            }
            if (tempFile.renameTo(targetFile)) {
                Log.d(TAG, "Extracted $relativePath (${targetFile.length()} bytes)")
                targetFile
            } else if (tempFile.exists()) {
                tempFile
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed extracting video asset $relativePath", e)
            null
        }
    }

    private fun handleVideoRangeRequest(path: String, request: WebResourceRequest): WebResourceResponse? {
        try {
            val file = getOrExtractVideoFile(path) ?: return null
            val totalLength = file.length()
            if (totalLength <= 0L) return null

            val rangeHeader = request.requestHeaders["Range"] ?: request.requestHeaders["range"]
            val mimeType = if (path.endsWith(".webm", ignoreCase = true)) "video/webm" else "video/mp4"

            if (rangeHeader.isNullOrBlank()) {
                val headers = mutableMapOf(
                    "Accept-Ranges" to "bytes",
                    "Content-Type" to mimeType,
                    "Content-Length" to totalLength.toString(),
                    "Access-Control-Allow-Origin" to "*"
                )
                val fis = FileInputStream(file)
                return WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, fis)
            }

            // Parse Range: bytes=START-END
            val rangeSpec = rangeHeader.substringAfter("bytes=").trim()
            val parts = rangeSpec.split("-")
            val start = parts.getOrNull(0)?.toLongOrNull() ?: 0L
            val end = if (parts.size > 1 && parts[1].isNotBlank()) parts[1].toLong() else (totalLength - 1L)

            val validEnd = minOf(end, totalLength - 1L)
            val validStart = maxOf(0L, minOf(start, validEnd))
            val contentLength = validEnd - validStart + 1L

            val raf = RandomAccessFile(file, "r")
            raf.seek(validStart)

            val boundedStream = object : InputStream() {
                private var remaining = contentLength

                override fun read(): Int {
                    if (remaining <= 0L) return -1
                    val b = raf.read()
                    if (b != -1) remaining--
                    return b
                }

                override fun read(b: ByteArray, off: Int, len: Int): Int {
                    if (remaining <= 0L) return -1
                    val toRead = minOf(len.toLong(), remaining).toInt()
                    val bytesRead = raf.read(b, off, toRead)
                    if (bytesRead > 0) {
                        remaining -= bytesRead
                    }
                    return bytesRead
                }

                override fun close() {
                    try {
                        raf.close()
                    } catch (ignored: Exception) {}
                }
            }

            val headers = mutableMapOf(
                "Content-Range" to "bytes $validStart-$validEnd/$totalLength",
                "Content-Length" to contentLength.toString(),
                "Content-Type" to mimeType,
                "Accept-Ranges" to "bytes",
                "Access-Control-Allow-Origin" to "*",
                "Cache-Control" to "no-cache"
            )

            Log.d(TAG, "Streaming video [$validStart-$validEnd/$totalLength]: $path")
            return WebResourceResponse(mimeType, "UTF-8", 206, "Partial Content", headers, boundedStream)

        } catch (e: Exception) {
            Log.e(TAG, "Error handling video range request for $path", e)
            return null
        }
    }

    private fun getMimeType(path: String): String {
        return when (path.substringAfterLast('.', "").lowercase()) {
            "html", "htm" -> "text/html"
            "js", "mjs" -> "application/javascript"
            "css" -> "text/css"
            "json" -> "application/json"
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            "gif" -> "image/gif"
            "svg" -> "image/svg+xml"
            "webp" -> "image/webp"
            "mp4" -> "video/mp4"
            "webm" -> "video/webm"
            "woff" -> "font/woff"
            "woff2" -> "font/woff2"
            "ttf" -> "font/ttf"
            else -> "application/octet-stream"
        }
    }

    private fun hideSystemUI() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.let { controller ->
                    controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                    controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
            }
        } catch (ignored: Exception) {}
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    // Hardware TV Remote & Keyboard Navigation
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        val wv = webView ?: return super.onKeyDown(keyCode, event)
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                wv.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));", null)
                return true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                wv.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));", null)
                return true
            }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                wv.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));", null)
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.KEYCODE_MEDIA_PAUSE, KeyEvent.KEYCODE_SPACE -> {
                wv.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));", null)
                return true
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                wv.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));", null)
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onBackPressed() {
        val wv = webView
        if (wv != null && wv.canGoBack()) {
            wv.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
