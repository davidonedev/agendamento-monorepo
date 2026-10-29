package com.agendepro.tenant;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TenantStatusConverter implements AttributeConverter<TenantStatus, String> {

    @Override
    public String convertToDatabaseColumn(TenantStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public TenantStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TenantStatus.fromValue(dbData);
    }
}
