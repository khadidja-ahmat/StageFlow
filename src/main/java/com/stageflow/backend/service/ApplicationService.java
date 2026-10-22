package com.stageflow.backend.service;

import com.stageflow.backend.dto.ApplicationDto;
import com.stageflow.backend.dto.ApplicationRequest;
import com.stageflow.backend.entity.Application;
import com.stageflow.backend.exception.ApplicationNotFoundException;
import com.stageflow.backend.repository.ApplicationRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ApplicationService {
    private final ApplicationRepository repository;

    // Spring injecte le Repository via cet unique constructeur.
    public ApplicationService(ApplicationRepository repository) { this.repository = repository; }

    public List<ApplicationDto> findAll() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "applicationDate", "id"))
                .stream().map(this::toDto).toList();
    }

    public ApplicationDto findById(Long id) { return toDto(requireApplication(id)); }

    @Transactional
    public ApplicationDto create(ApplicationRequest request) {
        Application application = new Application();
        copyFields(request, application);
        return toDto(repository.save(application));
    }

    @Transactional
    public ApplicationDto update(Long id, ApplicationRequest request) {
        Application application = requireApplication(id);
        copyFields(request, application);
        return toDto(repository.save(application));
    }

    @Transactional
    public void delete(Long id) { repository.delete(requireApplication(id)); }

    private Application requireApplication(Long id) {
        return repository.findById(id).orElseThrow(() -> new ApplicationNotFoundException(id));
    }

    private void copyFields(ApplicationRequest request, Application application) {
        application.setCompany(request.company().strip());
        application.setPosition(request.position().strip());
        application.setLocation(blankToNull(request.location()));
        application.setOfferUrl(blankToNull(request.offerUrl()));
        application.setApplicationDate(request.applicationDate());
        application.setStatus(request.status());
        application.setNotes(blankToNull(request.notes()));
    }

    // Un champ facultatif vide est stocké NULL en base : « pas de valeur » reste distinct de « texte vide ».
    private String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.strip();
    }

    // Le contrat JSON reste inchangé : une valeur absente est retournée comme chaîne vide.
    private String nullToEmpty(String value) { return value == null ? "" : value; }

    private ApplicationDto toDto(Application application) {
        return new ApplicationDto(application.getId(), application.getCompany(), application.getPosition(),
                nullToEmpty(application.getLocation()), nullToEmpty(application.getOfferUrl()),
                application.getApplicationDate(), application.getStatus(), nullToEmpty(application.getNotes()));
    }
}
