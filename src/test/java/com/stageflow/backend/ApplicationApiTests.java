package com.stageflow.backend;

import com.stageflow.backend.repository.ApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationApiTests {
    @LocalServerPort
    private int port;
    @Autowired
    private ApplicationRepository repository;
    private final HttpClient client = HttpClient.newHttpClient();
    private final JsonMapper mapper = JsonMapper.builder().build();

    private static final String VALID = """
            {"company":"Capgemini","position":"Développeur Java","location":"Paris",
             "offerUrl":"https://example.com/offre","applicationDate":"2026-09-29",
             "status":"APPLIED","notes":"Candidature envoyée"}
            """;

    @Test
    void createsReadsUpdatesAndDeletesAPersistedApplication() throws Exception {
        var created = request("POST", "", VALID);
        assertThat(created.statusCode()).isEqualTo(201);
        JsonNode application = mapper.readTree(created.body());
        long id = application.get("id").asLong();
        assertThat(id).isPositive();
        assertThat(created.headers().firstValue("Location")).hasValue("/api/applications/" + id);
        var fetched = request("GET", "/" + id, null);
        assertThat(fetched.statusCode()).isEqualTo(200);
        assertThat(mapper.readTree(fetched.body())).isEqualTo(application);
        assertThat(request("GET", "", null).body()).contains("Capgemini");

        var updated = request("PUT", "/" + id, VALID.replace("APPLIED", "INTERVIEW").replace("Paris", "Lyon"));
        assertThat(updated.statusCode()).isEqualTo(200);
        var persisted = mapper.readTree(request("GET", "/" + id, null).body());
        assertThat(persisted.get("status").asText()).isEqualTo("INTERVIEW");
        assertThat(persisted.get("location").asText()).isEqualTo("Lyon");
        assertThat(persisted.get("id").asLong()).isEqualTo(id);

        assertThat(request("DELETE", "/" + id, null).statusCode()).isEqualTo(204);
        assertThat(request("GET", "/" + id, null).statusCode()).isEqualTo(404);
    }

    @ParameterizedTest
    @ValueSource(strings = {"GET", "PUT", "DELETE"})
    void returns404ForMissingApplication(String method) throws Exception {
        var response = request(method, "/999999999", method.equals("PUT") ? VALID : null);
        assertThat(response.statusCode()).isEqualTo(404);
        assertThat(response.body()).contains("message");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{}",
            "{\"company\":\"   \",\"position\":\"Java\",\"applicationDate\":\"2026-09-29\",\"status\":\"APPLIED\"}",
            "{\"company\":\"Acme\",\"position\":\"Java\",\"applicationDate\":\"2026-09-29\",\"status\":\"UNKNOWN\"}",
            "{\"company\":\"Acme\",\"position\":\"Java\",\"applicationDate\":\"bad-date\",\"status\":\"APPLIED\"}",
            "{\"company\":\"Acme\",\"position\":\"Java\",\"applicationDate\":\"2026-09-29\",\"status\":\"APPLIED\",\"offerUrl\":\"javascript:alert(1)\"}",
            "{broken"
    })
    void rejectsInvalidPayload(String json) throws Exception {
        var response = request("POST", "", json);
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.body()).contains("message");
    }

    @ParameterizedTest
    @ValueSource(strings = {"TO_APPLY", "APPLIED", "INTERVIEW", "ACCEPTED", "REJECTED"})
    void acceptsEverySupportedStatus(String status) throws Exception {
        var created = request("POST", "", VALID.replace("APPLIED", status));
        assertThat(created.statusCode()).isEqualTo(201);
        var body = mapper.readTree(created.body());
        assertThat(body.get("status").asText()).isEqualTo(status);
        assertThat(request("DELETE", "/" + body.get("id").asLong(), null).statusCode()).isEqualTo(204);
    }

    @Test
    void storesBlankOptionalFieldsAsNullButReturnsEmptyStrings() throws Exception {
        var created = request("POST", "", """
                {"company":"Acme","position":"Java","applicationDate":"2026-09-29","status":"APPLIED",
                 "location":"   ","offerUrl":"   ","notes":""}
                """);
        assertThat(created.statusCode()).isEqualTo(201);
        JsonNode body = mapper.readTree(created.body());
        assertThat(body.get("location").asText()).isEmpty();
        assertThat(body.get("offerUrl").asText()).isEmpty();
        assertThat(body.get("notes").asText()).isEmpty();

        long id = body.get("id").asLong();
        var stored = repository.findById(id).orElseThrow();
        assertThat(stored.getLocation()).isNull();
        assertThat(stored.getOfferUrl()).isNull();
        assertThat(stored.getNotes()).isNull();
        assertThat(request("DELETE", "/" + id, null).statusCode()).isEqualTo(204);
    }

    @Test
    void acceptsAndTrimsLinkWithSurroundingSpaces() throws Exception {
        var created = request("POST", "", VALID.replace("https://example.com/offre", "  https://example.com/offre  "));
        assertThat(created.statusCode()).isEqualTo(201);
        JsonNode body = mapper.readTree(created.body());
        assertThat(body.get("offerUrl").asText()).isEqualTo("https://example.com/offre");
        assertThat(request("DELETE", "/" + body.get("id").asLong(), null).statusCode()).isEqualTo(204);
    }

    @Test
    void keepsHttpErrorCodesAndUsesTheApiErrorFormat() throws Exception {
        var unknownRoute = request("GET", "/1/inconnu", null);
        assertThat(unknownRoute.statusCode()).isEqualTo(404);
        assertThat(unknownRoute.body()).contains("message");

        var wrongMethod = request("PATCH", "/1", VALID);
        assertThat(wrongMethod.statusCode()).isEqualTo(405);
        assertThat(wrongMethod.body()).contains("message");
    }

    private HttpResponse<String> request(String method, String path, String json) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/applications" + path))
                .header("Content-Type", "application/json")
                .method(method, json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://?", "https://#", "https://", "ftp://example.com"})
    void rejectsLinksWithoutValidHttpHost(String url) throws Exception {
        assertThat(request("POST", "", VALID.replace("https://example.com/offre", url)).statusCode()).isEqualTo(400);
    }
}
