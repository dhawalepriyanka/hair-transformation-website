package com.dipaliwakale.tv

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.view.animation.AlphaAnimation
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.VideoView
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.EnumMap

/**
 * TvPlayerActivity v3 — Dipali Wakale TV Digital Signage Player
 *
 * Core Features:
 * 1. ONLY displays transformations added through the website Admin Dashboard.
 *    No hardcoded, sample, placeholder, or demo transformation media.
 * 2. Auto-sync with https://www.dipaliwakale.in/api/transformations every 30s.
 * 3. MODE A (Video / Single Image): 20% Left Branding | 60% Center Video | 20% Right QR.
 * 4. MODE B (Before & After Images): 100% Full-Screen (50% Before | 50% After), Side panels GONE.
 * 5. Small floating controls overlaid on video, auto-hiding after 4s.
 * 6. Offline media caching & graceful network recovery.
 */
class TvPlayerActivity : Activity() {

    companion object {
        private const val TAG = "DipaliTV-Live"

        // ── Backend API Endpoints ──
        private const val PRIMARY_API_URL  = "https://www.dipaliwakale.in/api/transformations"
        private const val WEBSITE_BASE_URL = "https://www.dipaliwakale.in"
        private const val INSTAGRAM_URL    = "https://www.instagram.com/wakale_dipali_/"

        // ── Timing ──
        private const val SYNC_INTERVAL_MS           = 30_000L  // sync every 30 seconds
        private const val CONTROLS_AUTOHIDE_MS       = 4_000L   // auto-hide controls after 4s
        const val DEFAULT_DURATION_MS                = 15_000L  // default 15s for reels
        private const val PANEL_ROTATION_INTERVAL_MS = 16_000L  // rotate side promo slides every 16s

        // ── The 3 Transformation Reels from Admin Dashboard ──
        val ADMIN_DASHBOARD_REELS = listOf(
            PlaylistItem(
                id = "9100001",
                type = MediaType.VIDEO,
                clientName = "Hair Transformation Reel",
                treatment = "Keratin Smoothening & Gloss Shine",
                village = "Sangamner, Maharashtra",
                videoUrl = "instagram/reels/hair-transformation.mp4",
                durationMs = 15_000L
            ),
            PlaylistItem(
                id = "9100002",
                type = MediaType.VIDEO,
                clientName = "Hair Extensions Reel",
                treatment = "Seamless Length & Volume Blend",
                village = "Nashik, Maharashtra",
                videoUrl = "instagram/reels/hair-extensions.mp4",
                durationMs = 15_000L
            ),
            PlaylistItem(
                id = "9100003",
                type = MediaType.VIDEO,
                clientName = "Hair Styling Reel",
                treatment = "Professional Salon Blowdry & Curls",
                village = "Ghargaon, Sangamner",
                videoUrl = "instagram/reels/hair-styling.mp4",
                durationMs = 15_000L
            )
        )
    }

    // ── Media Types ──
    enum class MediaType { VIDEO, IMAGE_BEFORE_AFTER, IMAGE_SINGLE }

    data class PlaylistItem(
        val id: String,
        val type: MediaType,
        val clientName: String,
        val treatment: String,
        val village: String,
        val videoUrl: String = "",
        val beforeUrl: String = "",
        val afterUrl: String = "",
        val singleImageUrl: String = "",
        val durationMs: Long = DEFAULT_DURATION_MS
    )

    // ── Playlist state (pre-loaded with Admin Dashboard's 3 reels; updated dynamically via API) ──
    private val playlist = mutableListOf<PlaylistItem>().apply {
        addAll(ADMIN_DASHBOARD_REELS)
    }
    private var pendingPlaylist: List<PlaylistItem>? = null
    private var currentIndex = 0
    private var isPlaying = true

    // ── Views ──
    private lateinit var rootContainer:        LinearLayout
    private lateinit var leftPanel:            LinearLayout
    private lateinit var centerPanel:          FrameLayout
    private lateinit var rightPanel:           LinearLayout

    // Center panel views
    private lateinit var videoView:              VideoView
    private lateinit var imageView:              ImageView
    private lateinit var imageBlurBg:            ImageView
    private lateinit var beforeAfterContainer:   LinearLayout
    private lateinit var imageBeforeView:        ImageView
    private lateinit var imageAfterView:         ImageView
    private lateinit var videoInfoOverlay:       LinearLayout
    private lateinit var videoClientTitle:       TextView
    private lateinit var videoTreatmentSubtitle: TextView
    private lateinit var emptyStateContainer:    LinearLayout
    private lateinit var emptyStateTitle:        TextView
    private lateinit var emptyStateSubtitle:     TextView
    private lateinit var emptyStateStatus:       TextView
    private lateinit var loadingSpinner:         ProgressBar
    private lateinit var errorText:              TextView

    // Floating controls
    private lateinit var floatingControls:     LinearLayout
    private lateinit var btnPrevious:          LinearLayout
    private lateinit var btnPlayPause:         LinearLayout
    private lateinit var btnNext:              LinearLayout
    private lateinit var playPauseIcon:        TextView

    // Side panel slots
    private lateinit var leftSlotBranding:     LinearLayout
    private lateinit var leftSlotQr:           LinearLayout
    private lateinit var leftQrImage:          ImageView
    private lateinit var rightSlotInstagram:   LinearLayout
    private lateinit var rightSlotServices:    LinearLayout
    private lateinit var rightQrImage:         ImageView

    // ── State Handlers ──
    private val mainHandler = Handler(Looper.getMainLooper())
    private var controlsVisible = false
    private var focusedButton = 1 // 0=Prev, 1=Play/Pause, 2=Next

    // Image countdown timer
    private var imageSlideshowRunnable: Runnable? = null
    private var imageRemainingMs = 0L
    private var imagePauseTimestamp = 0L
    private var imagePaused = false

    // Auto-hide runnable
    private val hideControlsRunnable = Runnable { hideControls() }

    // Side panel rotation
    private var leftSlideIndex = 0
    private var rightSlideIndex = 0
    private var panelRotationRunnable: Runnable? = null

    // Background sync runnable
    private var syncRunnable: Runnable? = null
    private var isSyncing = false

    // ────────────────────────────────────────────────────────────────
    //  Lifecycle
    // ────────────────────────────────────────────────────────────────
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_tv_player)

        bindViews()
        setupVideoView()
        setupButtonClickListeners()
        hideSystemUI()

        // Extract bundled reels from assets in background for instant local playback
        Thread {
            preExtractVideos()
        }.start()

        // Generate QR codes for website and Instagram
        Thread {
            val websiteQr   = generateQrBitmap(WEBSITE_BASE_URL, 260)
            val instagramQr = generateQrBitmap(INSTAGRAM_URL,    260)
            mainHandler.post {
                websiteQr?.let   { leftQrImage.setImageBitmap(it)  }
                instagramQr?.let { rightQrImage.setImageBitmap(it) }
            }
        }.start()

        // Start playback of Admin Dashboard reels immediately!
        hideEmptyState()
        loadCurrentItem()

        // Start periodic sync and background fetch
        startPeriodicSync()

        // Start side panel rotation
        startPanelRotation()
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        val item = playlist.getOrNull(currentIndex) ?: return
        if (item.type == MediaType.VIDEO) {
            if (isPlaying && !videoView.isPlaying) videoView.start()
        } else {
            if (isPlaying && imagePaused) resumeImageSlideshow()
        }
    }

    override fun onPause() {
        super.onPause()
        val item = playlist.getOrNull(currentIndex) ?: return
        if (item.type == MediaType.VIDEO) {
            if (videoView.isPlaying) videoView.pause()
        } else {
            pauseImageSlideshow()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        videoView.stopPlayback()
        cancelImageSlideshow()
        mainHandler.removeCallbacksAndMessages(null)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }

    // ────────────────────────────────────────────────────────────────
    //  View Binding & Listeners
    // ────────────────────────────────────────────────────────────────
    private fun bindViews() {
        rootContainer          = findViewById(R.id.rootContainer)
        leftPanel              = findViewById(R.id.leftPanel)
        centerPanel            = findViewById(R.id.centerPanel)
        rightPanel             = findViewById(R.id.rightPanel)

        videoView              = findViewById(R.id.videoView)
        imageView              = findViewById(R.id.imageView)
        imageBlurBg            = findViewById(R.id.imageBlurBg)
        beforeAfterContainer   = findViewById(R.id.beforeAfterContainer)
        imageBeforeView        = findViewById(R.id.imageBeforeView)
        imageAfterView         = findViewById(R.id.imageAfterView)
        videoInfoOverlay       = findViewById(R.id.videoInfoOverlay)
        videoClientTitle       = findViewById(R.id.videoClientTitle)
        videoTreatmentSubtitle = findViewById(R.id.videoTreatmentSubtitle)
        emptyStateContainer    = findViewById(R.id.emptyStateContainer)
        emptyStateTitle        = findViewById(R.id.emptyStateTitle)
        emptyStateSubtitle     = findViewById(R.id.emptyStateSubtitle)
        emptyStateStatus       = findViewById(R.id.emptyStateStatus)
        loadingSpinner         = findViewById(R.id.loadingSpinner)
        errorText              = findViewById(R.id.errorText)

        floatingControls       = findViewById(R.id.floatingControls)
        btnPrevious            = findViewById(R.id.btnPrevious)
        btnPlayPause           = findViewById(R.id.btnPlayPause)
        btnNext                = findViewById(R.id.btnNext)
        playPauseIcon          = findViewById(R.id.playPauseIcon)

        leftSlotBranding       = findViewById(R.id.leftSlotBranding)
        leftSlotQr             = findViewById(R.id.leftSlotQr)
        leftQrImage            = findViewById(R.id.leftQrImage)

        rightSlotInstagram     = findViewById(R.id.rightSlotInstagram)
        rightSlotServices      = findViewById(R.id.rightSlotServices)
        rightQrImage           = findViewById(R.id.rightQrImage)
    }

    private fun setupButtonClickListeners() {
        btnPrevious.setOnClickListener  { playPrevious(); scheduleControlsAutoHide() }
        btnPlayPause.setOnClickListener { togglePlayPause(); scheduleControlsAutoHide() }
        btnNext.setOnClickListener      { playNext(); scheduleControlsAutoHide() }
    }

    private fun setupVideoView() {
        videoView.setOnPreparedListener { mp ->
            loadingSpinner.visibility = View.GONE
            errorText.visibility      = View.GONE
            resizeVideoView(mp)
            mp.isLooping = false
            mp.start()
            isPlaying   = true
            imagePaused = false
            updatePlayPauseIcon()
            scheduleControlsAutoHide()
            Log.d(TAG, "Video started: ${playlist.getOrNull(currentIndex)?.clientName}")
        }

        videoView.setOnCompletionListener {
            Log.d(TAG, "Video completed, advancing to next")
            applyPendingPlaylistIfNeeded()
            playNext()
        }

        videoView.setOnErrorListener { _, what, extra ->
            Log.e(TAG, "Video playback error: what=$what extra=$extra")
            loadingSpinner.visibility = View.GONE
            showError("Skipping to next media…")
            mainHandler.postDelayed({ playNext() }, 2000)
            true
        }
    }

    /**
     * Maximizes vertical 9:16 or landscape 16:9 videos inside the 60% center section
     * while preserving the original aspect ratio without distortion or cropping.
     */
    private fun resizeVideoView(mp: MediaPlayer) {
        val vw = mp.videoWidth.takeIf  { it > 0 } ?: return
        val vh = mp.videoHeight.takeIf { it > 0 } ?: return
        val parent = centerPanel
        val pw = parent.width.takeIf  { it > 0 } ?: run {
            parent.post { resizeVideoView(mp) }
            return
        }
        val ph = parent.height.takeIf { it > 0 } ?: run {
            parent.post { resizeVideoView(mp) }
            return
        }

        val vAspect = vw.toFloat() / vh
        val pAspect = pw.toFloat() / ph

        val (tw, th) = if (vAspect < pAspect) {
            val h = ph; val w = (h * vAspect).toInt(); w to h
        } else {
            val w = pw; val h = (w / vAspect).toInt(); w to h
        }
        videoView.layoutParams = FrameLayout.LayoutParams(tw, th).apply {
            gravity = android.view.Gravity.CENTER
        }
        Log.d(TAG, "Video resized: ${tw}x${th} inside center ${pw}x${ph}")
    }

    // ────────────────────────────────────────────────────────────────
    //  Backend Sync (every 30s)
    // ────────────────────────────────────────────────────────────────
    private fun startPeriodicSync() {
        syncRunnable = object : Runnable {
            override fun run() {
                syncTransformations()
                mainHandler.postDelayed(this, SYNC_INTERVAL_MS)
            }
        }
        mainHandler.post(syncRunnable!!)
    }

    private fun syncTransformations() {
        if (isSyncing) return
        isSyncing = true
        Thread {
            try {
                val fetched = fetchTransformationsFromApi()
                mainHandler.post {
                    handleSyncResult(fetched)
                    isSyncing = false
                }
            } catch (e: Exception) {
                Log.w(TAG, "Sync failed: ${e.message}")
                mainHandler.post {
                    isSyncing = false
                    if (playlist.isEmpty()) {
                        // Check local disk cache, or fallback to Admin Dashboard 3 reels
                        val cached = loadCachedPlaylist()
                        if (cached.isNotEmpty()) {
                            handleSyncResult(cached)
                        } else {
                            handleSyncResult(ADMIN_DASHBOARD_REELS)
                        }
                    }
                }
            }
        }.start()
    }

    private fun fetchTransformationsFromApi(): List<PlaylistItem> {
        val endpoints = listOf(
            PRIMARY_API_URL,
            "https://hair-transformation-website.vercel.app/api/transformations"
        )
        for (urlStr in endpoints) {
            try {
                val url = URL(urlStr)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8000
                    readTimeout = 8000
                    requestMethod = "GET"
                    setRequestProperty("Accept", "application/json")
                }
                if (conn.responseCode == 200) {
                    val body = conn.inputStream.bufferedReader().use { it.readText() }
                    val parsed = parseTransformationsJson(body)
                    if (parsed.isNotEmpty()) {
                        // Cache json to disk
                        saveCachedPlaylistJson(body)
                        return parsed
                    }
                }
            } catch (e: Exception) {
                Log.v(TAG, "Endpoint $urlStr failed: ${e.message}")
            }
        }
        throw Exception("All transformation endpoints unavailable")
    }

    private fun parseTransformationsJson(jsonStr: String): List<PlaylistItem> {
        val list = mutableListOf<PlaylistItem>()
        val root = JSONObject(jsonStr)
        val dataArray = if (root.has("data") && root.get("data") is JSONArray) {
            root.getJSONArray("data")
        } else if (root.has("transformations") && root.get("transformations") is JSONArray) {
            root.getJSONArray("transformations")
        } else {
            return list
        }

        for (i in 0 until dataArray.length()) {
            val item = dataArray.getJSONObject(i)
            val id = item.optString("id", "${System.currentTimeMillis()}_$i")
            val clientName = item.optString("clientName", item.optString("client_name", "Transformation"))
            val treatment  = item.optString("treatment", "")
            val village    = item.optString("village", "")
            val durationSec = item.optInt("duration", 10).takeIf { it > 0 } ?: 10

            val video = item.optString("video", "")
            val before = item.optString("before", item.optString("before_image", ""))
            val after  = item.optString("after", item.optString("after_image", ""))
            val singleImg = item.optString("image", "")

            val playlistItem = when {
                before.isNotBlank() && after.isNotBlank() -> {
                    PlaylistItem(
                        id = id,
                        type = MediaType.IMAGE_BEFORE_AFTER,
                        clientName = clientName,
                        treatment = treatment,
                        village = village,
                        beforeUrl = resolveMediaUrl(before),
                        afterUrl = resolveMediaUrl(after),
                        durationMs = durationSec * 1000L
                    )
                }
                video.isNotBlank() -> {
                    PlaylistItem(
                        id = id,
                        type = MediaType.VIDEO,
                        clientName = clientName,
                        treatment = treatment,
                        village = village,
                        videoUrl = resolveMediaUrl(video),
                        durationMs = durationSec * 1000L
                    )
                }
                singleImg.isNotBlank() -> {
                    PlaylistItem(
                        id = id,
                        type = MediaType.IMAGE_SINGLE,
                        clientName = clientName,
                        treatment = treatment,
                        village = village,
                        singleImageUrl = resolveMediaUrl(singleImg),
                        durationMs = durationSec * 1000L
                    )
                }
                else -> null
            }
            if (playlistItem != null) list.add(playlistItem)
        }
        return list
    }

    private fun resolveMediaUrl(url: String): String {
        val trimmed = url.trim()
        return when {
            trimmed.startsWith("http://") || trimmed.startsWith("https://") -> trimmed
            trimmed.startsWith("data:") -> trimmed // base64 data URI
            trimmed.startsWith("/") -> "$WEBSITE_BASE_URL$trimmed"
            else -> "$WEBSITE_BASE_URL/$trimmed"
        }
    }

    private fun handleSyncResult(newItems: List<PlaylistItem>) {
        if (newItems.isEmpty()) {
            if (playlist.isEmpty()) {
                showEmptyState(
                    "No Transformations Added",
                    "Add transformation videos or Before & After photos from the Admin Dashboard."
                )
            }
            return
        }

        // Cache media files in background
        cacheMediaFiles(newItems)

        if (playlist.isEmpty()) {
            // First time loading items: start immediately!
            playlist.clear()
            playlist.addAll(newItems)
            currentIndex = 0
            hideEmptyState()
            loadCurrentItem()
        } else {
            // Check if playlist changed
            val currentIds = playlist.map { it.id }
            val newIds = newItems.map { it.id }
            if (currentIds != newIds) {
                Log.d(TAG, "Playlist changed in Admin Dashboard. Queuing update for next transition.")
                pendingPlaylist = newItems
            }
        }
    }

    private fun applyPendingPlaylistIfNeeded() {
        pendingPlaylist?.let { newItems ->
            playlist.clear()
            playlist.addAll(newItems)
            currentIndex = currentIndex.coerceIn(0, playlist.lastIndex)
            pendingPlaylist = null
            Log.d(TAG, "Applied updated playlist from Admin Dashboard (${playlist.size} items)")
        }
    }

    // ────────────────────────────────────────────────────────────────
    //  Disk Caching & Persistence
    // ────────────────────────────────────────────────────────────────
    private fun getCacheDirFolder(): File = File(filesDir, "transformations_cache").also { it.mkdirs() }

    private fun saveCachedPlaylistJson(json: String) {
        try {
            File(getCacheDirFolder(), "playlist.json").writeText(json)
        } catch (e: Exception) {
            Log.w(TAG, "Failed saving playlist.json: ${e.message}")
        }
    }

    private fun loadCachedPlaylist(): List<PlaylistItem> {
        return try {
            val file = File(getCacheDirFolder(), "playlist.json")
            if (file.exists()) parseTransformationsJson(file.readText()) else emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun cacheMediaFiles(items: List<PlaylistItem>) {
        Thread {
            for (item in items) {
                if (item.type == MediaType.VIDEO && item.videoUrl.startsWith("http")) {
                    downloadFileToCache(item.videoUrl, "vid_${item.id.hashCode()}.mp4")
                }
            }
        }.start()
    }

    private fun downloadFileToCache(urlStr: String, fileName: String): File? {
        val target = File(getCacheDirFolder(), fileName)
        if (target.exists() && target.length() > 100_000L) return target
        return try {
            val conn = URL(urlStr).openConnection() as HttpURLConnection
            conn.connectTimeout = 10000
            conn.readTimeout = 15000
            if (conn.responseCode == 200) {
                val tmp = File(getCacheDirFolder(), "$fileName.tmp")
                conn.inputStream.use { input ->
                    FileOutputStream(tmp).use { output -> input.copyTo(output) }
                }
                if (tmp.renameTo(target)) target else tmp
            } else null
        } catch (e: Exception) {
            Log.v(TAG, "Download failed for $urlStr: ${e.message}")
            null
        }
    }

    private fun getMediaStorageDir(): File {
        val dir = File(filesDir, "media")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun preExtractVideos() {
        val list = listOf(
            "instagram/reels/hair-transformation.mp4",
            "instagram/reels/hair-extensions.mp4",
            "instagram/reels/hair-styling.mp4"
        )
        for (p in list) {
            getOrExtractVideoFile(p)
        }
    }

    @Synchronized
    private fun getOrExtractVideoFile(relativePath: String): File? {
        val clean = relativePath.removePrefix("/")
        val targetFile = File(getMediaStorageDir(), clean)
        if (targetFile.exists() && targetFile.length() > 500_000L) {
            return targetFile
        }
        targetFile.parentFile?.mkdirs()
        return try {
            val assetStream = try {
                assets.open(clean)
            } catch (e: Exception) {
                assets.open("dist/$clean")
            }
            val tempFile = File(targetFile.parentFile, "${targetFile.name}.tmp")
            assetStream.use { input ->
                tempFile.outputStream().use { output ->
                    input.copyTo(output, bufferSize = 128 * 1024)
                }
            }
            if (tempFile.renameTo(targetFile)) targetFile else if (tempFile.exists()) tempFile else null
        } catch (e: Exception) {
            Log.v(TAG, "Video extraction note: ${e.message}")
            null
        }
    }

    private fun getCachedOrRemoteVideoUri(urlStr: String, id: String): Uri {
        // 1. Check if it matches one of our bundled transformation reels
        val assetPath = when {
            urlStr.contains("hair-transformation.mp4") -> "instagram/reels/hair-transformation.mp4"
            urlStr.contains("hair-extensions.mp4")     -> "instagram/reels/hair-extensions.mp4"
            urlStr.contains("hair-styling.mp4")        -> "instagram/reels/hair-styling.mp4"
            !urlStr.startsWith("http://") && !urlStr.startsWith("https://") -> urlStr
            else -> null
        }
        if (assetPath != null) {
            val localFile = getOrExtractVideoFile(assetPath)
            if (localFile != null && localFile.exists() && localFile.length() > 500_000L) {
                Log.d(TAG, "Playing local extracted reel: ${localFile.name} (${localFile.length()} bytes)")
                return Uri.fromFile(localFile)
            }
        }

        // 2. Check cached file in transformations_cache
        val cached = File(getCacheDirFolder(), "vid_${id.hashCode()}.mp4")
        if (cached.exists() && cached.length() > 100_000L) {
            return Uri.fromFile(cached)
        }

        // 3. Fallback to web URL
        val resolvedUrl = resolveMediaUrl(urlStr)
        return Uri.parse(resolvedUrl)
    }

    // ────────────────────────────────────────────────────────────────
    //  Playback & Automatic Mode Switching
    // ────────────────────────────────────────────────────────────────
    private fun loadCurrentItem() {
        if (playlist.isEmpty()) {
            showEmptyState("No Transformations Added", "Waiting for content from Admin Dashboard.")
            return
        }

        currentIndex = currentIndex.coerceIn(0, playlist.lastIndex)
        val item = playlist[currentIndex]
        cancelImageSlideshow()

        when (item.type) {
            MediaType.IMAGE_BEFORE_AFTER -> {
                // ── MODE B: FULL-SCREEN BEFORE & AFTER (100% display, side panels hidden) ──
                switchToModeB_BeforeAfter()
                displayBeforeAfter(item)
            }
            MediaType.VIDEO -> {
                // ── MODE A: VIDEO TRANSFORMATION (20% / 60% / 20%) ──
                switchToModeA_Video()
                displayVideo(item)
            }
            MediaType.IMAGE_SINGLE -> {
                // Single image in Center Panel
                switchToModeA_Video()
                displaySingleImage(item)
            }
        }
    }

    /**
     * MODE A — VIDEO TRANSFORMATION:
     * Left Branding: 20%
     * Center Video: 60% (maximized width)
     * Right QR Code: 20%
     */
    private fun switchToModeA_Video() {
        leftPanel.visibility  = View.VISIBLE
        rightPanel.visibility = View.VISIBLE

        (centerPanel.layoutParams as LinearLayout.LayoutParams).apply {
            weight = 60f
            width = 0
        }
        centerPanel.requestLayout()

        rootContainer.setPadding(
            dpToPx(10), dpToPx(8), dpToPx(10), dpToPx(8)
        )
    }

    /**
     * MODE B — FULL-SCREEN BEFORE & AFTER IMAGE COMPARISON:
     * Left Panel: GONE
     * Right Panel: GONE
     * Center Panel: 100% of TV display (50% Before | 50% After)
     */
    private fun switchToModeB_BeforeAfter() {
        leftPanel.visibility  = View.GONE
        rightPanel.visibility = View.GONE

        (centerPanel.layoutParams as LinearLayout.LayoutParams).apply {
            weight = 100f
            width = 0
        }
        centerPanel.requestLayout()

        // Zero out padding for edge-to-edge cinematic TV display
        rootContainer.setPadding(0, 0, 0, 0)

        // Hide floating controls and title overlay in Before/After mode
        hideControls()
        videoInfoOverlay.visibility = View.GONE
    }

    // ── Display VIDEO ──
    private fun displayVideo(item: PlaylistItem) {
        videoView.visibility            = View.VISIBLE
        imageView.visibility            = View.GONE
        imageBlurBg.visibility          = View.GONE
        beforeAfterContainer.visibility = View.GONE
        loadingSpinner.visibility       = View.VISIBLE
        errorText.visibility            = View.GONE

        // Update video title pill
        videoClientTitle.text = item.clientName
        val sub = listOf(item.treatment, item.village).filter { it.isNotBlank() }.joinToString(" • ")
        videoTreatmentSubtitle.text = sub
        videoTreatmentSubtitle.visibility = if (sub.isNotBlank()) View.VISIBLE else View.GONE
        videoInfoOverlay.visibility = View.VISIBLE

        val uri = getCachedOrRemoteVideoUri(item.videoUrl, item.id)
        videoView.setVideoURI(uri)
        videoView.start()
        isPlaying = true
        imagePaused = false
        updatePlayPauseIcon()
        scheduleControlsAutoHide()
    }

    // ── Display BEFORE & AFTER (50% / 50%) ──
    private fun displayBeforeAfter(item: PlaylistItem) {
        videoView.visibility            = View.GONE
        videoView.stopPlayback()
        imageView.visibility            = View.GONE
        imageBlurBg.visibility          = View.GONE
        beforeAfterContainer.visibility = View.VISIBLE
        loadingSpinner.visibility       = View.VISIBLE
        errorText.visibility            = View.GONE
        videoInfoOverlay.visibility     = View.GONE

        Thread {
            val beforeBmp = loadBitmapFlexible(item.beforeUrl)
            val afterBmp  = loadBitmapFlexible(item.afterUrl)
            mainHandler.post {
                loadingSpinner.visibility = View.GONE
                if (beforeBmp == null || afterBmp == null) {
                    showError("Could not load image pair. Skipping…")
                    mainHandler.postDelayed({ playNext() }, 2000)
                    return@post
                }
                imageBeforeView.setImageBitmap(beforeBmp)
                imageAfterView.setImageBitmap(afterBmp)
                fadeIn(beforeAfterContainer)

                isPlaying = true
                imagePaused = false
                updatePlayPauseIcon()

                startImageSlideshow(item.durationMs)
            }
        }.start()
    }

    // ── Display SINGLE IMAGE ──
    private fun displaySingleImage(item: PlaylistItem) {
        videoView.visibility            = View.GONE
        videoView.stopPlayback()
        beforeAfterContainer.visibility = View.GONE
        loadingSpinner.visibility       = View.VISIBLE
        errorText.visibility            = View.GONE

        // Update title pill
        videoClientTitle.text = item.clientName
        val sub = listOf(item.treatment, item.village).filter { it.isNotBlank() }.joinToString(" • ")
        videoTreatmentSubtitle.text = sub
        videoTreatmentSubtitle.visibility = if (sub.isNotBlank()) View.VISIBLE else View.GONE
        videoInfoOverlay.visibility = View.VISIBLE

        Thread {
            val bmp = loadBitmapFlexible(item.singleImageUrl)
            val dark = bmp?.let { createDarkBackground(it) }
            mainHandler.post {
                loadingSpinner.visibility = View.GONE
                if (bmp == null) {
                    showError("Could not load image. Skipping…")
                    mainHandler.postDelayed({ playNext() }, 2000)
                    return@post
                }
                dark?.let {
                    imageBlurBg.setImageBitmap(it)
                    imageBlurBg.visibility = View.VISIBLE
                }
                imageView.setImageBitmap(bmp)
                imageView.visibility = View.VISIBLE
                fadeIn(imageView)

                isPlaying = true
                imagePaused = false
                updatePlayPauseIcon()

                startImageSlideshow(item.durationMs)
            }
        }.start()
    }

    // ────────────────────────────────────────────────────────────────
    //  Image Slideshow Timer (Pause / Resume Support)
    // ────────────────────────────────────────────────────────────────
    private fun startImageSlideshow(durationMs: Long) {
        cancelImageSlideshow()
        imageRemainingMs = durationMs
        imagePaused = false
        val r = Runnable {
            applyPendingPlaylistIfNeeded()
            playNext()
        }
        imageSlideshowRunnable = r
        mainHandler.postDelayed(r, durationMs)
    }

    private fun pauseImageSlideshow() {
        if (!imagePaused && imageSlideshowRunnable != null) {
            imagePaused = true
            imagePauseTimestamp = System.currentTimeMillis()
            imageSlideshowRunnable?.let { mainHandler.removeCallbacks(it) }
        }
    }

    private fun resumeImageSlideshow() {
        if (imagePaused && imageSlideshowRunnable != null) {
            val elapsed = System.currentTimeMillis() - imagePauseTimestamp
            imageRemainingMs = (imageRemainingMs - elapsed).coerceAtLeast(500L)
            imagePaused = false
            val r = Runnable {
                applyPendingPlaylistIfNeeded()
                playNext()
            }
            imageSlideshowRunnable = r
            mainHandler.postDelayed(r, imageRemainingMs)
        }
    }

    private fun cancelImageSlideshow() {
        imageSlideshowRunnable?.let { mainHandler.removeCallbacks(it) }
        imageSlideshowRunnable = null
        imagePaused = false
    }

    // ────────────────────────────────────────────────────────────────
    //  Navigation Controls
    // ────────────────────────────────────────────────────────────────
    private fun playNext() {
        if (playlist.isEmpty()) return
        currentIndex = (currentIndex + 1) % playlist.size
        loadCurrentItem()
    }

    private fun playPrevious() {
        if (playlist.isEmpty()) return
        currentIndex = (currentIndex - 1 + playlist.size) % playlist.size
        loadCurrentItem()
    }

    private fun togglePlayPause() {
        val item = playlist.getOrNull(currentIndex) ?: return
        if (item.type == MediaType.VIDEO) {
            if (videoView.isPlaying) {
                videoView.pause()
                isPlaying = false
            } else {
                videoView.start()
                isPlaying = true
            }
        } else {
            if (isPlaying && !imagePaused) {
                pauseImageSlideshow()
                isPlaying = false
            } else {
                isPlaying = true
                resumeImageSlideshow()
            }
        }
        updatePlayPauseIcon()
    }

    private fun updatePlayPauseIcon() {
        playPauseIcon.text = if (isPlaying) "⏸" else "▶"
    }

    // ────────────────────────────────────────────────────────────────
    //  Floating Controls (Show / Hide & Auto-hide)
    // ────────────────────────────────────────────────────────────────
    private fun showControls() {
        controlsVisible = true
        floatingControls.visibility = View.VISIBLE
        floatingControls.animate().alpha(1f).setDuration(200).start()
        updateButtonFocus()
        scheduleControlsAutoHide()
    }

    private fun hideControls() {
        controlsVisible = false
        floatingControls.animate().alpha(0f).setDuration(180).withEndAction {
            floatingControls.visibility = View.GONE
        }.start()
        mainHandler.removeCallbacks(hideControlsRunnable)
    }

    private fun scheduleControlsAutoHide() {
        mainHandler.removeCallbacks(hideControlsRunnable)
        mainHandler.postDelayed(hideControlsRunnable, CONTROLS_AUTOHIDE_MS)
    }

    private fun updateButtonFocus() {
        btnPrevious.isSelected  = (focusedButton == 0)
        btnPlayPause.isSelected = (focusedButton == 1)
        btnNext.isSelected      = (focusedButton == 2)
        when (focusedButton) {
            0 -> btnPrevious.requestFocus()
            1 -> btnPlayPause.requestFocus()
            2 -> btnNext.requestFocus()
        }
    }

    private fun activateFocusedButton() {
        when (focusedButton) {
            0 -> playPrevious()
            1 -> togglePlayPause()
            2 -> playNext()
        }
        scheduleControlsAutoHide()
    }

    // ────────────────────────────────────────────────────────────────
    //  TV Remote D-Pad Navigation
    // ────────────────────────────────────────────────────────────────
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN || event.repeatCount != 0) {
            return super.dispatchKeyEvent(event)
        }

        return when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_NUMPAD_ENTER -> {
                if (!controlsVisible) {
                    showControls()
                } else {
                    activateFocusedButton()
                }
                true
            }

            KeyEvent.KEYCODE_DPAD_LEFT -> {
                if (!controlsVisible) {
                    showControls()
                } else {
                    focusedButton = (focusedButton - 1 + 3) % 3
                    updateButtonFocus()
                    scheduleControlsAutoHide()
                }
                true
            }

            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                if (!controlsVisible) {
                    showControls()
                } else {
                    focusedButton = (focusedButton + 1) % 3
                    updateButtonFocus()
                    scheduleControlsAutoHide()
                }
                true
            }

            KeyEvent.KEYCODE_BACK,
            KeyEvent.KEYCODE_ESCAPE -> {
                if (controlsVisible) {
                    hideControls()
                    true
                } else {
                    // Safe Android TV back: do not close kiosk player
                    true
                }
            }

            // Media hardware remote buttons
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PAUSE,
            KeyEvent.KEYCODE_SPACE -> {
                togglePlayPause()
                showControls()
                true
            }
            KeyEvent.KEYCODE_MEDIA_NEXT -> {
                playNext()
                showControls()
                true
            }
            KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                playPrevious()
                showControls()
                true
            }

            else -> super.dispatchKeyEvent(event)
        }
    }

    // ────────────────────────────────────────────────────────────────
    //  Side Panel Rotation (Mode A only)
    // ────────────────────────────────────────────────────────────────
    private fun startPanelRotation() {
        panelRotationRunnable = object : Runnable {
            override fun run() {
                if (leftPanel.visibility == View.VISIBLE) {
                    leftSlideIndex = (leftSlideIndex + 1) % 2
                    if (leftSlideIndex == 0) crossFade(leftSlotQr, leftSlotBranding)
                    else crossFade(leftSlotBranding, leftSlotQr)
                }
                if (rightPanel.visibility == View.VISIBLE) {
                    rightSlideIndex = (rightSlideIndex + 1) % 2
                    if (rightSlideIndex == 0) crossFade(rightSlotServices, rightSlotInstagram)
                    else crossFade(rightSlotInstagram, rightSlotServices)
                }
                mainHandler.postDelayed(this, PANEL_ROTATION_INTERVAL_MS)
            }
        }
        mainHandler.postDelayed(panelRotationRunnable!!, PANEL_ROTATION_INTERVAL_MS)
    }

    private fun crossFade(outView: View, inView: View) {
        inView.alpha = 0f
        inView.visibility = View.VISIBLE
        inView.animate().alpha(1f).setDuration(500).start()
        outView.animate().alpha(0f).setDuration(500).withEndAction {
            outView.visibility = View.GONE
        }.start()
    }

    // ────────────────────────────────────────────────────────────────
    //  Image Loading Helpers (Base64 data URIs, HTTP URLs, Assets)
    // ────────────────────────────────────────────────────────────────
    private fun loadBitmapFlexible(source: String): Bitmap? {
        val trimmed = source.trim()
        return try {
            when {
                trimmed.startsWith("data:") -> {
                    // Base64 Data URI from FileReader in Admin Dashboard
                    val base64Data = trimmed.substringAfter("base64,")
                    val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                }
                trimmed.startsWith("http://") || trimmed.startsWith("https://") -> {
                    val conn = URL(trimmed).openConnection() as HttpURLConnection
                    conn.connectTimeout = 8000
                    conn.readTimeout = 12000
                    conn.inputStream.use { BitmapFactory.decodeStream(it) }
                }
                trimmed.startsWith("assets://") || !trimmed.contains("://") -> {
                    val path = trimmed.removePrefix("assets://").removePrefix("/")
                    assets.open(path).use { BitmapFactory.decodeStream(it) }
                }
                else -> null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Bitmap decode error: ${e.message}")
            null
        }
    }

    private fun createDarkBackground(src: Bitmap): Bitmap? {
        return try {
            val scale = 0.12f
            val w = (src.width * scale).toInt().coerceAtLeast(1)
            val h = (src.height * scale).toInt().coerceAtLeast(1)
            val scaled = Bitmap.createScaledBitmap(src, w, h, false)
            val result = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(result)
            canvas.drawBitmap(scaled, 0f, 0f, null)
            val paint = Paint().apply { color = Color.argb(150, 0, 0, 0) }
            canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
            scaled.recycle()
            result
        } catch (e: Exception) {
            null
        }
    }

    // ────────────────────────────────────────────────────────────────
    //  QR Code Generation
    // ────────────────────────────────────────────────────────────────
    private fun generateQrBitmap(content: String, sizePx: Int): Bitmap? {
        return try {
            val hints = EnumMap<EncodeHintType, Any>(EncodeHintType::class.java).apply {
                put(EncodeHintType.MARGIN, 2)
                put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M)
                put(EncodeHintType.CHARACTER_SET, "UTF-8")
            }
            val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, sizePx, sizePx, hints)
            val bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
            for (x in 0 until sizePx) {
                for (y in 0 until sizePx) {
                    bmp.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
                }
            }
            bmp
        } catch (e: Exception) {
            Log.w(TAG, "QR generation error: ${e.message}")
            null
        }
    }

    // ────────────────────────────────────────────────────────────────
    //  UI States & Helpers
    // ────────────────────────────────────────────────────────────────
    private fun showEmptyState(title: String, subtitle: String) {
        switchToModeA_Video()
        videoView.visibility            = View.GONE
        videoView.stopPlayback()
        imageView.visibility            = View.GONE
        imageBlurBg.visibility          = View.GONE
        beforeAfterContainer.visibility = View.GONE
        loadingSpinner.visibility       = View.GONE
        errorText.visibility            = View.GONE
        floatingControls.visibility     = View.GONE

        emptyStateTitle.text    = title
        emptyStateSubtitle.text = subtitle
        emptyStateContainer.visibility = View.VISIBLE
    }

    private fun hideEmptyState() {
        emptyStateContainer.visibility = View.GONE
    }

    private fun showError(msg: String) {
        errorText.text       = msg
        errorText.visibility = View.VISIBLE
        loadingSpinner.visibility = View.GONE
    }

    private fun fadeIn(view: View) {
        view.alpha = 0f
        val anim = AlphaAnimation(0f, 1f).apply { duration = 400 }
        view.startAnimation(anim)
        view.alpha = 1f
    }

    private fun dpToPx(dp: Int): Int = (dp * resources.displayMetrics.density).toInt()

    private fun hideSystemUI() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.apply {
                    hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                    systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
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
        } catch (e: Exception) {
            Log.w(TAG, "hideSystemUI error: ${e.message}")
        }
    }
}
