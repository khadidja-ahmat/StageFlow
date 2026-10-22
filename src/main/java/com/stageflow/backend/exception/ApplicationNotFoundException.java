package com.stageflow.backend.exception;

public class ApplicationNotFoundException extends RuntimeException {
    public ApplicationNotFoundException(Long id) {
        super("La candidature " + id + " est introuvable.");
    }
}
