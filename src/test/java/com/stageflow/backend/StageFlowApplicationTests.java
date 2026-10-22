package com.stageflow.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class StageFlowApplicationTests {

    @Test
    void contextLoads() {
        // Vérifie que le contexte Spring démarre avec la configuration de test.
    }
}
