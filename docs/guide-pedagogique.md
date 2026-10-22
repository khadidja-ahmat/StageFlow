# Comprendre StageFlow

Ce guide suit l'ordre de construction du projet existant. Pour chaque étape : objectif, petit extrait, rôle du code, automatismes et vérification.

## 1. Relier Spring Boot à MySQL

**Pourquoi :** les candidatures doivent rester disponibles après un redémarrage, contrairement à une liste Java en mémoire.

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/stageflow}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
spring.jpa.hibernate.ddl-auto=update
```

`jdbc:mysql` sélectionne le pilote MySQL ; `localhost:3306` désigne le serveur ; `stageflow` désigne la base.
`${DB_USERNAME:root}` lit une variable d'environnement et utilise `root` si elle est absente.
Maven fournit le pilote `mysql-connector-j` et les bibliothèques JPA.
Spring Boot détecte ces dépendances, configure une `DataSource` et un pool de connexions HikariCP.
Hibernate consulte la base et, avec `update`, ajuste les tables correspondant aux entités.

**Vérifier :** lancer `.\mvnw.cmd spring-boot:run`. Chercher `HikariPool ... Start completed` et `Started StageFlowApplication`.
`clean compile` compile Java mais ne teste pas la connexion. `Access denied` signale souvent un compte/mot de passe incorrect ; `Communications link failure` un serveur indisponible ou un mauvais port.

## 2. Le point d'entrée

```java
@SpringBootApplication
public class StageFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(StageFlowApplication.class, args);
    }
}
```

`main` est le point d'entrée Java. `run` crée le contexte Spring et démarre le serveur embarqué.
`@SpringBootApplication` regroupe une configuration Spring, l'auto-configuration et le scan des composants.
Spring cherche notamment les contrôleurs et services dans `com.stageflow.backend` et ses sous-packages.
L'auto-configuration choisit des composants en fonction des dépendances et propriétés disponibles : serveur Tomcat, MVC, JSON, JPA, transactions…
Un **bean** est un objet créé et géré par Spring.

**Vérifier :** appeler `GET http://localhost:8080/api/applications` dans un navigateur ou Postman.

## 3. L'entité et les statuts

```java
@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}
```

`@Entity` indique qu'un objet représente une ligne persistée. `@Table` fixe le nom de la table.
`@Id` indique la clé primaire. `@GeneratedValue(IDENTITY)` délègue l'identifiant à l'auto-incrément MySQL.
`@Column(nullable = false, length = 120)` décrit la colonne, sa nullabilité et sa taille.
Le constructeur sans argument permet à JPA de reconstruire les objets lus en base.
Les getters exposent les données ; les setters permettent au service de modifier les champs.
Il n'y a pas de setter pour `id` : le client n'a pas à choisir l'identifiant.

```java
@Enumerated(EnumType.STRING)
private ApplicationStatus status;
```

L'enum limite le domaine aux cinq statuts. `STRING` stocke par exemple `INTERVIEW`, plutôt qu'un numéro dépendant de l'ordre des constantes.
`LocalDate` stocke une date sans heure ni fuseau horaire. L'API utilise `yyyy-MM-dd`.

**JPA** est la spécification qui décrit la persistance objet/relationnel en Java.
**Hibernate** est l'implémentation utilisée : il associe objets et tables et produit les requêtes SQL.

**Vérifier dans MySQL :** `SHOW TABLES;` puis `DESCRIBE applications;` après démarrage.

## 4. Le Repository

```java
public interface ApplicationRepository extends JpaRepository<Application, Long> {}
```

`Application` est le type persisté ; `Long` est le type de sa clé primaire.
`JpaRepository` fournit notamment `findAll`, `findById`, `save` et `delete`.
Spring Data génère une implémentation de cette interface au démarrage et l'enregistre comme bean.
Nous n'écrivons donc ni classe d'implémentation ni SQL pour ces opérations courantes.

`@Repository` est un stéréotype Spring pour la couche d'accès aux données ; il participe aussi à la traduction des exceptions de persistance.
Il est utile sur une classe d'accès personnalisée, mais inutile sur cette interface : Spring Data s'en charge déjà.

**Vérifier :** créer une candidature via l'API puis exécuter `SELECT * FROM applications;` dans MySQL.

## 5. Le Service et l'injection de dépendances

```java
@Service
public class ApplicationService {
    private final ApplicationRepository repository;

    public ApplicationService(ApplicationRepository repository) {
        this.repository = repository;
    }
}
```

`@Service` rend la classe détectable comme bean métier.
L'injection par constructeur signifie que le service déclare ce dont il a besoin ; Spring lui fournit le Repository.
Nous ne faisons pas `new ApplicationRepository()` et il n'est pas nécessaire d'ajouter `@Autowired` avec un seul constructeur.
Le champ `final` indique que cette dépendance ne sera pas remplacée après construction.

Les méthodes :

| Méthode | Responsabilité |
|---|---|
| `findAll` | Lire les données, les trier, convertir en DTO |
| `findById` | Lire une candidature existante |
| `create` | Construire une entité, copier les champs, l'enregistrer |
| `update` | Charger l'entité existante et remplacer ses champs |
| `delete` | Vérifier l'existence puis supprimer |
| `requireApplication` | Partager la lecture et l'erreur « introuvable » |
| `copyFields` | Affecter les champs et nettoyer les espaces extérieurs |
| `blankToNull` | Retirer les espaces extérieurs et stocker `NULL` si une valeur facultative est vide |
| `nullToEmpty` | Retourner une chaîne vide dans le JSON quand la base contient `NULL` |
| `toDto` | Construire la réponse publique sans exposer l'entité (`NULL` → chaîne vide) |

`@Transactional(readOnly = true)` indique des lectures par défaut ; les écritures utilisent `@Transactional`.
Spring ouvre une transaction autour de l'appel au service, la valide si l'appel réussit ou l'annule en cas d'exception non contrôlée.
Hibernate suit les changements des entités chargées dans la transaction. `save` rend ici l'intention d'écriture explicite ; sur une entité déjà gérée, le suivi des modifications peut suffire.
`spring.jpa.open-in-view=false` évite de garder la session de persistance ouverte pendant le rendu HTTP.

**Vérifier :** modifier une candidature puis faire un nouveau GET : la modification doit être conservée.

## 6. DTO et validation

```java
public record ApplicationRequest(
    @NotBlank String company,
    @NotNull ApplicationStatus status
) {}
```

Extrait simplifié : le vrai record contient les sept champs modifiables.
Un `record` Java est un conteneur immuable qui génère constructeur, accesseurs, égalité et représentation textuelle.
`ApplicationRequest` décrit les données reçues ; `ApplicationDto` décrit les huit champs retournés, dont `id`.
Cette séparation évite de coupler le contrat JSON à la gestion Hibernate de l'entité.

`@NotBlank` refuse les textes vides ou uniquement composés d'espaces ; `@NotNull` exige une valeur ; `@Size` limite une longueur.
La contrainte personnalisée `@HttpUrl` appelle `HttpUrlValidator.isValid`, qui analyse l'URI et vérifie HTTP/S, l'hôte et le port.
Les espaces extérieurs sont ignorés, comme dans le service, et un lien vide ou blanc est accepté : le lien reste facultatif. Le validateur n'ouvre pas l'URL et ne contacte aucun site.
Le frontend valide aussi les saisies, mais le backend reste responsable : n'importe qui peut appeler l'API sans passer par React.

**Vérifier :** envoyer `{}` par POST doit retourner 400 avec les champs à corriger.

## 7. Le Controller, HTTP et JSON

```java
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    @PostMapping
    public ResponseEntity<ApplicationDto> createApplication(
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationDto created = service.create(request);
        return ResponseEntity.created(URI.create("/api/applications/" + created.id()))
                .body(created);
    }
}
```

`@RestController` déclare un contrôleur dont les retours sont écrits dans la réponse HTTP, généralement en JSON.
`@RequestMapping` fixe le préfixe commun des routes.
`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` associent une méthode Java à une méthode HTTP.
`@PathVariable` récupère l'identifiant contenu dans l'URL.
`@RequestBody` demande la conversion du corps JSON en objet Java ; `@Valid` lance sa validation.
`ResponseEntity` permet de choisir explicitement statut, en-têtes et corps de réponse.

HTTP est le protocole d'échange requête/réponse. JSON est le format textuel des données, avec objets, tableaux, chaînes et nombres.
Jackson assure les conversions JSON ↔ Java. Spring MVC choisit le contrôleur, lit les paramètres, valide et sérialise la réponse.
Le contrôleur appelle le service ; il ne manipule pas directement MySQL.

**Codes à expliquer :** 200 lecture/modification réussie, 201 création, 204 suppression sans corps, 400 saisie invalide, 404 candidature ou route absente, 405 méthode non autorisée, 500 erreur imprévue.

`@RestControllerAdvice` centralise les erreurs de plusieurs contrôleurs.
`@ExceptionHandler` associe un type d'exception à une réponse : `ApplicationNotFoundException` → 404, validation ou JSON illisible → 400.
Un dernier gestionnaire, sur `Exception`, sert de filet de sécurité : les erreurs HTTP connues de Spring (route inconnue → 404, méthode non autorisée → 405) gardent leur code, et toute autre erreur devient un 500 journalisé.
La classe `ApiError` décrit le JSON d'erreur commun. Les détails techniques internes ne sont pas renvoyés par ces gestionnaires.

**Vérifier :** `Invoke-RestMethod http://localhost:8080/api/applications` affiche les objets retournés.

## 8. React et la communication avec le backend

```javascript
const response = await fetch('/api/applications');
const applications = await response.json();
```

`fetch` envoie une requête HTTP asynchrone. `response.json()` lit la réponse et la convertit en valeurs JavaScript.
Pour POST/PUT, `JSON.stringify` produit le texte JSON et `Content-Type: application/json` en indique le format.
`api.js` centralise ces opérations et les erreurs ; une réponse 204 n'a pas de JSON à lire.

`App` conserve la liste, les filtres et l'état des opérations avec `useState`.
`useEffect` charge les données après montage ; `useCallback` stabilise les fonctions utilisées par les effets.
`ApplicationCard` affiche une candidature ; `ApplicationForm` gère ses champs ; `Modal` gère l'affichage et le focus clavier.
Les **props** transmettent données et callbacks du parent aux composants enfants.
Une réponse serveur réussie met à jour l'état React ; React actualise ensuite l'affichage. Après un rechargement, la liste vient à nouveau de MySQL.

Vite est le serveur de développement et l'outil de build. Son proxy transmet `/api` à Spring Boot.
Pour le navigateur, ces appels utilisent la même origine que le frontend, ce qui évite une configuration CORS permissive.
Si frontend et API sont déployés sur des origines différentes plus tard, il faudra choisir un reverse proxy ou configurer précisément CORS.

**Vérifier :** dans les outils développeur du navigateur → Réseau, observer POST, son JSON et le code 201 lors d'une création.

## 9. Maven, JUnit et qualité

`pom.xml` décrit les dépendances, versions et plugins. Le parent Spring Boot gère la cohérence des versions Java.
Le wrapper `mvnw`/`mvnw.cmd` fixe la version de Maven pour faciliter la reproduction du build.

| Commande | Effet |
|---|---|
| `compile` | Compile les sources de production |
| `test` | Compile et exécute les tests |
| `package` | Exécute les étapes précédentes et construit le JAR |
| `verify` | Exécute le cycle jusqu'aux vérifications finales |
| `clean` | Supprime les résultats du build précédent dans `target` |
| `spring-boot:run` | Lance l'application via le plugin Spring Boot |

JUnit fournit `@Test`, les tests paramétrés et l'exécution des cas. AssertJ exprime les assertions.
`@SpringBootTest` démarre le contexte complet ; `RANDOM_PORT` évite le conflit avec le serveur de développement.
`@ActiveProfiles("test")` charge la configuration H2 de test.
Les tests HTTP vérifient toutes les couches, plutôt que de simuler chaque méthode du Repository.
Vitest et Testing Library vérifient le frontend à travers les interactions utilisateur.
Git garde l'historique local ; GitHub héberge le dépôt et exécute la CI définie par GitHub Actions.

**Vérifier :** lancer `verify` à la racine, puis `npm.cmd test` et `npm.cmd run build` dans `frontend`.

## Références

- [Documentation Spring Boot](https://docs.spring.io/spring-boot/reference/)
- [Tests Spring Boot avec serveur HTTP](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html)
- [Documentation React](https://react.dev/learn)
- [Démarrage et prérequis Vite](https://vite.dev/guide/)
