package com.stageflow.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.net.URI;

public class HttpUrlValidator implements ConstraintValidator<HttpUrl, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Le lien est facultatif, mais une valeur renseignée doit être exploitable.
        // Les espaces extérieurs sont ignorés : le service les retire aussi avant l'enregistrement.
        if (value == null || value.isBlank()) return true;
        try {
            URI uri = URI.create(value.strip());
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null && uri.getUserInfo() == null
                    && (uri.getPort() == -1 || (uri.getPort() > 0 && uri.getPort() <= 65535));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
