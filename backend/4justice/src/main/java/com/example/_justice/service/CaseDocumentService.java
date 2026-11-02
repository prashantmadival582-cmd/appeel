package com.example._justice.service;

import com.example._justice.entity.CaseDocument;
import com.example._justice.repository.CaseDocumentRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CaseDocumentService {

    private final CaseDocumentRepository caseDocumentRepository;

    private final Path uploadDirectory =
        Paths.get(System.getenv().getOrDefault(
                "UPLOAD_DIR", "uploads"
        ), "cases").toAbsolutePath().normalize();

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx",
            "xls", "xlsx",
            "png", "jpg", "jpeg"
    );

    public CaseDocumentService(
            CaseDocumentRepository caseDocumentRepository) {
        this.caseDocumentRepository = caseDocumentRepository;
    }

    public CaseDocument uploadDocument(
            String caseId,
            MultipartFile file) throws IOException {

        if (caseId == null || caseId.isBlank()) {
            throw new IllegalArgumentException("Case ID is required.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size must be 10 MB or less.");
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException(
                    "The uploaded file must have a filename.");
        }

        String safeOriginalName =
                Paths.get(originalName).getFileName().toString();

        int dotIndex = safeOriginalName.lastIndexOf('.');

        if (dotIndex <= 0 || dotIndex == safeOriginalName.length() - 1) {
            throw new IllegalArgumentException(
                    "The file must have a supported extension.");
        }

        String extension = safeOriginalName
                .substring(dotIndex + 1)
                .toLowerCase(Locale.ROOT);

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Unsupported file type. Upload PDF, DOC, DOCX, "
                    + "XLS, XLSX, PNG, JPG, or JPEG.");
        }

        Files.createDirectories(uploadDirectory);

        String storedName = UUID.randomUUID() + "." + extension;
        Path storedPath = uploadDirectory.resolve(storedName).normalize();

        if (!storedPath.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Invalid file path.");
        }

        try (var inputStream = file.getInputStream()) {
            Files.copy(inputStream, storedPath);
        }

        CaseDocument document = new CaseDocument();
        document.setCaseId(caseId);
        document.setFileName(safeOriginalName);
        document.setFileType(resolveContentType(file, extension));
        document.setFilePath(storedName);

        try {
            return caseDocumentRepository.save(document);
        } catch (RuntimeException e) {
            Files.deleteIfExists(storedPath);
            throw e;
        }
    }

    public List<CaseDocument> getDocumentsByCaseId(String caseId) {
        return caseDocumentRepository.findByCaseId(caseId);
    }

    public List<CaseDocument> getAllDocuments() {
        return caseDocumentRepository.findAllByOrderByIdDesc();
    }

    public CaseDocument getDocumentById(Long documentId) {
        return caseDocumentRepository.findById(documentId).orElse(null);
    }

    public byte[] downloadDocument(Long documentId) throws IOException {
    CaseDocument document = getDocumentById(documentId);

    if (document == null || document.getFilePath() == null) {
        return null;
    }

    // Support both new filename-only records and old Windows paths.
    String storedPath = document.getFilePath().replace("\\", "/");
    String storedName = Paths.get(storedPath).getFileName().toString();

    Path filePath = uploadDirectory.resolve(storedName)
            .toAbsolutePath()
            .normalize();

    // Only allow downloads from the configured upload directory.
    if (!filePath.startsWith(uploadDirectory)
            || !Files.isRegularFile(filePath)) {
        return null;
    }

    return Files.readAllBytes(filePath);
}
    

    private String resolveContentType(
            MultipartFile file,
            String extension) {

        String contentType = file.getContentType();

        if (contentType != null
                && !contentType.isBlank()
                && !contentType.equalsIgnoreCase(
                        "application/octet-stream")) {
            return contentType;
        }

        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" ->
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls" -> "application/vnd.ms-excel";
            case "xlsx" ->
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            default -> "application/octet-stream";
        };
    }
}