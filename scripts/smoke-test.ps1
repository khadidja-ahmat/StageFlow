param([string]$BaseUrl = 'http://localhost:8080')

$ErrorActionPreference = 'Stop'
$endpoint = "$BaseUrl/api/applications"
$createdId = $null
$payload = @{
    company = 'StageFlow - test temporaire'
    position = 'Developpeur Java'
    location = 'Paris'
    offerUrl = 'https://example.com/offre'
    applicationDate = (Get-Date -Format 'yyyy-MM-dd')
    status = 'APPLIED'
    notes = 'Cette candidature est supprimee automatiquement par le test.'
}

try {
    $created = Invoke-WebRequest -UseBasicParsing -Uri $endpoint -Method Post -ContentType 'application/json' -Body ($payload | ConvertTo-Json)
    if ($created.StatusCode -ne 201) { throw 'POST doit retourner 201.' }
    $createdId = ($created.Content | ConvertFrom-Json).id
    if (-not $createdId) { throw 'Identifiant absent de la reponse.' }

    $read = Invoke-RestMethod -Uri "$endpoint/$createdId"
    if ($read.company -ne $payload.company) { throw 'La lecture ne correspond pas a la creation.' }

    $payload.status = 'INTERVIEW'
    $updated = Invoke-RestMethod -Uri "$endpoint/$createdId" -Method Put -ContentType 'application/json' -Body ($payload | ConvertTo-Json)
    if ($updated.status -ne 'INTERVIEW') { throw 'Le statut est incorrect apres modification.' }
    $persisted = Invoke-RestMethod -Uri "$endpoint/$createdId"
    if ($persisted.status -ne 'INTERVIEW') { throw 'La modification ne persiste pas.' }

    $all = Invoke-RestMethod -Uri $endpoint
    if (-not ($all | Where-Object id -eq $createdId)) { throw 'La candidature est absente de la liste.' }

    $deleted = Invoke-WebRequest -UseBasicParsing -Uri "$endpoint/$createdId" -Method Delete
    if ($deleted.StatusCode -ne 204) { throw 'DELETE doit retourner 204.' }
    try {
        Invoke-WebRequest -UseBasicParsing -Uri "$endpoint/$createdId" | Out-Null
        throw 'La candidature supprimee existe encore.'
    } catch {
        if ([int]$_.Exception.Response.StatusCode -ne 404) { throw }
    }
    $createdId = $null
    Write-Output 'PASS - POST 201, GET 200, PUT 200, persistance, liste, DELETE 204 et GET 404.'
} finally {
    # Nettoyer uniquement l'enregistrement cree par ce test.
    if ($createdId) {
        Invoke-RestMethod -Uri "$endpoint/$createdId" -Method Delete | Out-Null
    }
}
