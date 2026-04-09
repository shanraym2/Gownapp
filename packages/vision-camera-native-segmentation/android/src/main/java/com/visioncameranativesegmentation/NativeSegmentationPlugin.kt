package com.visioncameranativesegmentation

import android.graphics.Bitmap
import android.graphics.Color
import android.util.Base64
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.SegmentationMask
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.io.ByteArrayOutputStream
import java.nio.FloatBuffer
import java.util.HashMap

class NativeSegmentationPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {

  private val segmenter by lazy {
    val opts =
      SelfieSegmenterOptions.Builder()
        .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
        .build()
    Segmentation.getClient(opts)
  }

  override fun callback(frame: Frame, arguments: Map<String, Any>?): HashMap<String, Any> {
    return try {
      val mediaImage = frame.image
      val orientation = frame.orientation

      fun surfaceRotationToDegrees(value: Int): Int =
        when (value) {
          android.view.Surface.ROTATION_0 -> 0
          android.view.Surface.ROTATION_90 -> 90
          android.view.Surface.ROTATION_180 -> 180
          android.view.Surface.ROTATION_270 -> 270
          else -> 0
        }

      val rotation = surfaceRotationToDegrees(orientation.toSurfaceRotation())
      val input = InputImage.fromMediaImage(mediaImage, rotation)
      val mask: SegmentationMask = Tasks.await(segmenter.process(input))

      val w = mask.width
      val h = mask.height
      val buffer = mask.buffer.duplicate()
      buffer.rewind()
      val floatBuffer: FloatBuffer = buffer.asFloatBuffer()

      val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
      var i = 0
      val total = w * h
      while (i < total && floatBuffer.hasRemaining()) {
        val conf = floatBuffer.get()
        val x = i % w
        val y = i / w
        val c = if (conf > 0.5f) Color.BLACK else Color.WHITE
        bitmap.setPixel(x, y, c)
        i++
      }

      val maxDim = 240
      val scale = minOf(maxDim.toFloat() / w, maxDim.toFloat() / h, 1f)
      val tw = (w * scale).toInt().coerceAtLeast(1)
      val th = (h * scale).toInt().coerceAtLeast(1)
      val scaled = Bitmap.createScaledBitmap(bitmap, tw, th, true)
      if (scaled != bitmap) {
        bitmap.recycle()
      }

      val out = ByteArrayOutputStream()
      scaled.compress(Bitmap.CompressFormat.PNG, 92, out)
      scaled.recycle()
      val b64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)

      hashMapOf(
        "maskBase64" to b64,
        "maskWidth" to tw,
        "maskHeight" to th,
      )
    } catch (e: Throwable) {
      hashMapOf("error" to (e.message ?: "segmentation failed"))
    }
  }
}
