package com.agendepro.user;

/** Política de senha única da plataforma (mesmo mínimo já usado em ChangePasswordRequest). */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 6;
    public static final String MIN_LENGTH_MESSAGE = "A senha deve ter no mínimo 6 caracteres";

    private PasswordPolicy() {
    }
}
