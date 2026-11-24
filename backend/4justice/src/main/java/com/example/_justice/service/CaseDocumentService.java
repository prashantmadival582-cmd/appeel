
package com.example._justice.service;

import com.example._justice.entity.CaseDocument;
import com.example._justice.repository.CaseDocumentRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class CaseDocumentService {

    private final CaseDocumentRepository caseDocumentRepository;
    private final SupabaseStorageService supabaseStorageService;

    private final Path uploadDirectory =
            Paths.get(System.getenv().getOrDefault(
                    "UPLOAD_DIR", "uploads"
            ), "cases").toAbsolutePath().normalize();

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "pdf", "application/pdf",
            "doc", "application/msword",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "csv", "text/csv",
            "xls", "application/vnd.ms-excel",
            "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    public CaseDocumentService(
            CaseDocumentRepository caseDocumentRepository,
            SupabaseStorageService supabaseStorageService) {

        this.caseDocumentRepository = caseDocumentRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    // =========================================
    // UPLOAD DOCUMENT
    // =========================================

    public CaseDocument uploadDocument(
            String caseId,
            MultipartFile file) throws IOException {

        if (caseId == null || caseId.isBlank()) {
            throw new IllegalArgumentException("Case ID is required.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file.");
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("Invalid filename.");
        }

        String safeOriginalName = originalName
                .replace("\\", "/");

        safeOriginalName = Paths.get(safeOriginalName)
                .getFileName()
                .toString();

        int dotIndex = safeOriginalName.lastIndexOf('.');

        if (dotIndex <= 0 || dotIndex == safeOriginalName.length() - 1) {
            throw new IllegalArgumentException("Invalid file extension.");
        }

        String extension = safeOriginalName
                .substring(dotIndex + 1)
                .toLowerCase(Locale.ROOT);

        String contentType = ALLOWED_TYPES.get(extension);

        if (contentType == null) {
            throw new IllegalArgumentException(
                    "Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, CSV, XLS and XLSX.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Each file must be 10 MB or less.");
        }

        byte[] fileBytes = file.getBytes();

        if (!isValidFileContent(extension, fileBytes)) {
            throw new IllegalArgumentException(
                    "The selected file does not appear to be a valid "
                            + extension.toUpperCase(Locale.ROOT) + " file.");
        }

        String safeCaseId = caseId.replaceAll("[^a-zA-Z0-9_-]", "_");

        String storedName = UUID.randomUUID() + "." + extension;

        String objectPath =
                "cases/" + safeCaseId + "/" + storedName;

        supabaseStorageService.uploadFile(
                objectPath,
                fileBytes,
                contentType
        );

        CaseDocument document = new CaseDocument();
        document.setCaseId(caseId);
        document.setFileName(safeOriginalName);
        document.setFileType(contentType);
        document.setFilePath(objectPath);

        try {
            return caseDocumentRepository.save(document);

        } catch (RuntimeException e) {

            try {
                supabaseStorageService.deleteFile(objectPath);
            } catch (RuntimeException cleanupException) {
                e.addSuppressed(cleanupException);
            }

            throw e;
        }
    }

    // =========================================
    // FILE CONTENT VALIDATION
    // =========================================

    private boolean isValidFileContent(String extension, byte[] bytes) {

        if (bytes == null || bytes.length == 0) {
            return false;
        }

        switch (extension) {

            case "pdf":
                return startsWith(bytes, new byte[]{
                        0x25, 0x50, 0x44, 0x46, 0x2D
                });

            case "png":
                return startsWith(bytes, new byte[]{
                        (byte) 0x89, 0x50, 0x4E, 0x47,
                        0x0D, 0x0A, 0x1A, 0x0A
                });

            case "jpg":
            case "jpeg":
                return startsWith(bytes, new byte[]{
                        (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
                });

            case "doc":
            case "xls":
                return startsWith(bytes, new byte[]{
                        (byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0,
                        (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1
                });

            case "docx":
            case "xlsx":
                return startsWith(bytes, new byte[]{
                        0x50, 0x4B, 0x03, 0x04
                });

            case "csv":
                return isValidCsvText(bytes);

            default:
                return false;
        }
    }

    private boolean startsWith(byte[] bytes, byte[] signature) {

        if (bytes.length < signature.length) {
            return false;
        }

        for (int i = 0; i < signature.length; i++) {
            if (bytes[i] != signature[i]) {
                return false;
            }
        }

        return true;
    }

    private boolean isValidCsvText(byte[] bytes) {

        try {
            StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes));

            for (byte value : bytes) {

                int character = value & 0xFF;

                if (character == 0) {
                    return false;
                }

                if (character < 32
                        && character != 9
                        && character != 10
                        && character != 13) {
                    return false;
                }
            }

            return true;

        } catch (CharacterCodingException e) {
            return false;
        }
    }

    // =========================================
    // GET DOCUMENTS
    // =========================================

    public List<CaseDocument> getDocumentsByCaseId(String caseId) {
        return caseDocumentRepository.findByCaseId(caseId);
    }

    public List<CaseDocument> getAllDocuments() {
        return caseDocumentRepository.findAllByOrderByIdDesc();
    }

    public CaseDocument getDocumentById(Long documentId) {
        return caseDocumentRepository.findById(documentId).orElse(null);
    }

    // =========================================
    // DOWNLOAD DOCUMENT
    // =========================================

    public byte[] downloadDocument(Long documentId) throws IOException {

        CaseDocument document = getDocumentById(documentId);

        if (document == null || document.getFilePath() == null) {
            return null;
        }

        String storedPath = document.getFilePath().replace("\\", "/");

        if (storedPath.startsWith("cases/")) {
            return supabaseStorageService.downloadFile(storedPath);
        }

        String storedName = Paths.get(storedPath).getFileName().toString();

        Path filePath = uploadDirectory.resolve(storedName)
                .toAbsolutePath()
                .normalize();

        if (!filePath.startsWith(uploadDirectory)
                || !Files.isRegularFile(filePath)) {
            return null;
        }

        return Files.readAllBytes(filePath);
    }

    // =========================================
    // DELETE DOCUMENT
    // =========================================

    public void deleteDocument(Long documentId) {

        CaseDocument document = getDocumentById(documentId);

        if (document == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        String storedPath = document.getFilePath();

        if (storedPath != null && !storedPath.isBlank()) {

            storedPath = storedPath.replace("\\", "/");

            if (storedPath.startsWith("cases/")) {

                supabaseStorageService.deleteFile(storedPath);

            } else {

                String storedName =
                        Paths.get(storedPath).getFileName().toString();

                Path filePath = uploadDirectory.resolve(storedName)
                        .toAbsolutePath()
                        .normalize();

                if (filePath.startsWith(uploadDirectory)) {

                    try {
                        Files.deleteIfExists(filePath);

                    } catch (IOException e) {
                        throw new IllegalStateException(
                                "Could not delete the stored document.", e);
                    }
                }
            }
        }

        caseDocumentRepository.delete(document);
    }
}
