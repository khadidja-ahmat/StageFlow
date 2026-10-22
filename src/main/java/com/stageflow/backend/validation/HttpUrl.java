package com.stageflow.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({FIELD, PARAMETER, RECORD_COMPONENT})
@Retention(RUNTIME)
@Constraint(validatedBy = HttpUrlValidator.class)
public @interface HttpUrl {
    String message() default "Le lien doit être une URL HTTP ou HTTPS avec un hôte valide.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
