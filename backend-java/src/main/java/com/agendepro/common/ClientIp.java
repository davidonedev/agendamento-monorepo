package com.agendepro.common;

import jakarta.servlet.http.HttpServletRequest;

/** IP de origem da requisição — primeiro valor de X-Forwarded-For, senão o remoteAddr. */
public final class ClientIp {

    private ClientIp() {
    }

    public static String of(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
