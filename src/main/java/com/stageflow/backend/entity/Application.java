package com.stageflow.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String company;
    @Column(nullable = false, length = 160)
    private String position;
    @Column(length = 160)
    private String location;
    @Column(length = 2048)
    private String offerUrl;
    @Column(nullable = false)
    private LocalDate applicationDate;
    // Stocker le nom évite de dépendre de l'ordre des constantes de l'enum.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;
    @Column(length = 5000)
    private String notes;

    public Application() {
        // Constructeur sans argument requis par JPA.
    }

    public Long getId() { return id; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getOfferUrl() { return offerUrl; }
    public void setOfferUrl(String offerUrl) { this.offerUrl = offerUrl; }
    public LocalDate getApplicationDate() { return applicationDate; }
    public void setApplicationDate(LocalDate applicationDate) { this.applicationDate = applicationDate; }
    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
