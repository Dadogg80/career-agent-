package com.careeragent.documents.infrastructure

import com.careeragent.documents.domain.DocumentStorage
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.nio.file.attribute.PosixFilePermissions
import java.util.UUID

@Component
@Profile("persistence")
class LocalDocumentStorage(@Value("\${DOCUMENT_STORAGE_PATH:local-data/documents}") root: String) : DocumentStorage {
    private val directory = Path.of(root).toAbsolutePath().normalize()
    private fun path(id: UUID) = directory.resolve("$id.original")
    override fun put(id: UUID, bytes: ByteArray) {
        Files.createDirectories(directory)
        if (Files.getFileStore(directory).supportsFileAttributeView("posix")) Files.setPosixFilePermissions(directory, PosixFilePermissions.fromString("rwx------"))
        Files.createFile(path(id), *if (Files.getFileStore(directory).supportsFileAttributeView("posix")) arrayOf(PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------"))) else emptyArray())
        try { Files.write(path(id), bytes, StandardOpenOption.WRITE) } catch (error: Exception) { Files.deleteIfExists(path(id)); throw error }
    }
    override fun read(id: UUID): ByteArray = Files.readAllBytes(path(id))
    override fun delete(id: UUID) { Files.deleteIfExists(path(id)) }
}
