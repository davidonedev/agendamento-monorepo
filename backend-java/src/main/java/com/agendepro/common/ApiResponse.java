package com.agendepro.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Envelope de resposta padrão da API — espelha o formato do backend Node
 * ({@code { success: true, data }} / {@code { success: false, error, code, details? }})
 * para que o frontend (frontend/src/lib/api.ts) não precise de nenhuma alteração.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String error,
        String code,
        List<FieldError> details
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, null);
    }

    public static <T> ApiResponse<T> error(String error, String code) {
        return new ApiResponse<>(false, null, error, code, null);
    }

    public static <T> ApiResponse<T> error(String error, String code, List<FieldError> details) {
        return new ApiResponse<>(false, null, error, code, details);
    }

    public record FieldError(String field, String message) {
    }
}
