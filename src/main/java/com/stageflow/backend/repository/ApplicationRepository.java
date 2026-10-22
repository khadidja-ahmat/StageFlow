package com.stageflow.backend.repository;

import com.stageflow.backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

// Spring Data génère l'implémentation et l'enregistre comme bean Repository.
public interface ApplicationRepository extends JpaRepository<Application, Long> {}
