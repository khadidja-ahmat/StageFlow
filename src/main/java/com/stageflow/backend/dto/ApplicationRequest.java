package com.stageflow.backend.dto;

import com.stageflow.backend.entity.ApplicationStatus;
import com.stageflow.backend.validation.HttpUrl;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** Données modifiables : l'identifiant est généré par la base. */
public record ApplicationRequest(
        @NotBlank(message = "L'entreprise est obligatoire.")
        @Size(max = 120, message = "L'entreprise est limitée à 120 caractères.") String company,
        @NotBlank(message = "Le poste est obligatoire.")
        @Size(max = 160, message = "Le poste est limité à 160 caractères.") String position,
        @Size(max = 160, message = "La ville est limitée à 160 caractères.") String location,
        @Size(max = 2048, message = "Le lien est limité à 2048 caractères.")
        @HttpUrl String offerUrl,
        @NotNull(message = "La date est obligatoire.") LocalDate applicationDate,
        @NotNull(message = "Le statut est obligatoire.") ApplicationStatus status,
        @Size(max = 5000, message = "Les notes sont limitées à 5000 caractères.") String notes
) {}
