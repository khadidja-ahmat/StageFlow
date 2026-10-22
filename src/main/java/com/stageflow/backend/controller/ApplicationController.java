package com.stageflow.backend.controller;

import com.stageflow.backend.dto.ApplicationDto;
import com.stageflow.backend.dto.ApplicationRequest;
import com.stageflow.backend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    private final ApplicationService service;

    public ApplicationController(ApplicationService service) { this.service = service; }

    @GetMapping
    public List<ApplicationDto> getApplications() { return service.findAll(); }

    @GetMapping("/{id}")
    public ApplicationDto getApplication(@PathVariable Long id) { return service.findById(id); }

    @PostMapping
    public ResponseEntity<ApplicationDto> createApplication(@Valid @RequestBody ApplicationRequest request) {
        ApplicationDto created = service.create(request);
        return ResponseEntity.created(URI.create("/api/applications/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ApplicationDto updateApplication(@PathVariable Long id, @Valid @RequestBody ApplicationRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
