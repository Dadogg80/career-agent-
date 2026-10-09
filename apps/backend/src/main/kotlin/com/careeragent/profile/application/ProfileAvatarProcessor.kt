package com.careeragent.profile.application

import org.springframework.stereotype.Component
import java.awt.Color
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import javax.imageio.IIOImage
import javax.imageio.ImageIO
import javax.imageio.stream.ImageInputStream

data class ProfileAvatar(val bytes: ByteArray, val mediaType: String = "image/jpeg")

@Component
class ProfileAvatarProcessor {
    fun process(bytes: ByteArray, mediaType: String?): ProfileAvatar {
        if (bytes.isEmpty()) throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)
        if (bytes.size > MAX_UPLOAD_BYTES) throw ProfileFailure("PROFILE_AVATAR_TOO_LARGE", 413)
        val requestedType = mediaType?.substringBefore(';')?.trim()?.lowercase()
        if (requestedType !in setOf("image/jpeg", "image/png")) throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)

        try {
            val input = ImageIO.createImageInputStream(ByteArrayInputStream(bytes))
                ?: throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)
            input.use { stream ->
                val readers = ImageIO.getImageReaders(stream)
                if (!readers.hasNext()) throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)
                val reader = readers.next()
                try {
                    reader.input = stream
                    val format = reader.formatName.lowercase()
                    val actualType = when (format) {
                        "jpeg", "jpg" -> "image/jpeg"
                        "png" -> "image/png"
                        else -> throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)
                    }
                    if (actualType != requestedType) throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)
                    val width = reader.getWidth(0)
                    val height = reader.getHeight(0)
                    if (width <= 0 || height <= 0 || width > MAX_DIMENSION || height > MAX_DIMENSION ||
                        width.toLong() * height > MAX_PIXELS
                    ) throw ProfileFailure("PROFILE_AVATAR_TOO_LARGE", 413)
                    val decoded = reader.read(0) ?: throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)
                    try {
                        return ProfileAvatar(encode(decoded))
                    } finally {
                        decoded.flush()
                    }
                } finally {
                    reader.dispose()
                }
            }
        } catch (failure: ProfileFailure) {
            throw failure
        } catch (_: IOException) {
            throw ProfileFailure("PROFILE_AVATAR_INVALID", 400)
        }
    }

    private fun encode(source: BufferedImage): ByteArray {
        val scale = minOf(AVATAR_SIZE.toDouble() / source.width, AVATAR_SIZE.toDouble() / source.height)
        val width = (source.width * scale).toInt().coerceAtLeast(1)
        val height = (source.height * scale).toInt().coerceAtLeast(1)
        val normalized = BufferedImage(AVATAR_SIZE, AVATAR_SIZE, BufferedImage.TYPE_INT_RGB)
        val graphics = normalized.createGraphics()
        try {
            graphics.color = Color.WHITE
            graphics.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
            graphics.drawImage(source, (AVATAR_SIZE - width) / 2, (AVATAR_SIZE - height) / 2, width, height, null)
        } finally {
            graphics.dispose()
        }
        try {
            ByteArrayOutputStream().use { bytes ->
                val writer = ImageIO.getImageWritersByFormatName("jpeg").asSequence().firstOrNull()
                    ?: throw ProfileFailure("PROFILE_AVATAR_UNAVAILABLE", 503)
                try {
                    val output = ImageIO.createImageOutputStream(bytes)
                        ?: throw ProfileFailure("PROFILE_AVATAR_UNAVAILABLE", 503)
                    output.use { imageOutput ->
                        writer.output = imageOutput
                        val parameters = writer.defaultWriteParam
                        if (parameters.canWriteCompressed()) {
                            parameters.compressionMode = javax.imageio.ImageWriteParam.MODE_EXPLICIT
                            parameters.compressionQuality = 0.82f
                        }
                        writer.write(null, IIOImage(normalized, null, null), parameters)
                        imageOutput.flush()
                    }
                } finally {
                    writer.dispose()
                    normalized.flush()
                }
                val result = bytes.toByteArray()
                if (result.size > MAX_STORED_BYTES) throw ProfileFailure("PROFILE_AVATAR_TOO_LARGE", 413)
                return result
            }
        } catch (failure: ProfileFailure) {
            throw failure
        } catch (_: IOException) {
            throw ProfileFailure("PROFILE_AVATAR_UNAVAILABLE", 503)
        }
    }

    private companion object {
        const val MAX_UPLOAD_BYTES = 2_000_000
        const val MAX_STORED_BYTES = 500_000
        const val MAX_DIMENSION = 4096
        const val MAX_PIXELS = 4_000_000L
        const val AVATAR_SIZE = 512
    }
}
