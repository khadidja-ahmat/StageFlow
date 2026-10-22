package com.stageflow.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    public record ApiError(String message, Map<String, String> errors) {}

    @ExceptionHandler(ApplicationNotFoundException.class)
    public ResponseEntity<ApiError> notFound(ApplicationNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError(exception.getMessage(), Map.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError("Vérifie les champs du formulaire.", errors));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> invalidFormat(Exception exception) {
        return ResponseEntity.badRequest().body(new ApiError(
                "Format invalide : vérifie le JSON, le statut, la date et l'identifiant.", Map.of()));
    }

    /** Filet de sécurité : toute erreur imprévue garde le même format JSON que les autres erreurs de l'API. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception exception) {
        // Les erreurs HTTP déjà connues de Spring (route inconnue, méthode non autorisée…) conservent leur code.
        if (exception instanceof ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();
            return ResponseEntity.status(status).headers(errorResponse.getHeaders())
                    .body(new ApiError(httpMessage(status), Map.of()));
        }
        log.error("Erreur inattendue dans l'API", exception);
        return ResponseEntity.internalServerError()
                .body(new ApiError("Une erreur interne est survenue. Réessaie dans un instant.", Map.of()));
    }

    private static String httpMessage(HttpStatusCode status) {
        return switch (status.value()) {
            case 404 -> "Ressource introuvable.";
            case 405 -> "Méthode HTTP non autorisée pour cette route.";
            case 415 -> "Type de contenu non pris en charge : envoie du JSON.";
            default -> "La requête n'a pas pu être traitée.";
        };
    }
}
