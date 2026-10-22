package com.stageflow.backend.dto;

import com.stageflow.backend.entity.ApplicationStatus;
import java.time.LocalDate;

/** Réponse JSON indépendante de la gestion de l'entité par Hibernate. */
public record ApplicationDto(
        Long id, String company, String position, String location, String offerUrl,
        LocalDate applicationDate, ApplicationStatus status, String notes
) {}
