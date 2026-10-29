package com.agendepro.professional;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

/** Chave composta da tabela de junção professional_services (ProfessionalServiceLink). */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ProfessionalServiceLinkId implements Serializable {

    private UUID professionalId;
    private UUID serviceId;
}
