package com.agendepro.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Erro de domínio da aplicação — porta direta de {@code AppError} (types/index.ts) do
 * backend Node. Carrega o status HTTP e um código de erro estável para o frontend.
 */
@Getter
public class AppException extends RuntimeException {

    private final int statusCode;
    private final String code;

    public AppException(String message) {
        this(message, 400, null);
    }

    public AppException(String message, int statusCode) {
        this(message, statusCode, null);
    }

    public AppException(String message, int statusCode, String code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }

    public AppException(String message, HttpStatus status, String code) {
        this(message, status.value(), code);
    }

    // ─── Fábricas de conveniência para os casos mais comuns ────────────────────

    public static AppException notFound(String message) {
        return new AppException(message, 404, "NOT_FOUND");
    }

    public static AppException forbidden(String message) {
        return new AppException(message, 403, "FORBIDDEN");
    }

    public static AppException unauthorized(String message, String code) {
        return new AppException(message, 401, code);
    }

    public static AppException conflict(String message, String code) {
        return new AppException(message, 409, code);
    }

    public static AppException badRequest(String message) {
        return new AppException(message, 400, null);
    }

    public static AppException badRequest(String message, String code) {
        return new AppException(message, 400, code);
    }
}
