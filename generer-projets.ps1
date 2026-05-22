# ============================================================
#  Générateur de content.json pour la section Projets
# ============================================================
#  Quand l'utiliser :
#    - Après avoir ajouté un nouveau dossier projet
#    - Après avoir ajouté des photos dans un sous-dossier
#    - Après avoir renommé un dossier projet
#
#  Structure attendue dans public\content\projects\ :
#    N. Lieu - Nom du projet\
#      titre.jpg          <- image de couverture (ou dans un sous-dossier)
#      Concept\           <- photos de la phase Concept (optionnel)
#      Manufacturing\     <- photos de la phase Manufacturing (optionnel)
#      Commissioning\     <- photos de la phase Commissioning (optionnel)
#
#  Lancement : clic droit > "Exécuter avec PowerShell"
#  Ou en ligne de commande : .\generer-projets.ps1
# ============================================================

$ErrorActionPreference = 'Stop'

$racine     = $PSScriptRoot
$contentDir = Join-Path $racine 'public\content\projects'
$jsonFile   = Join-Path $contentDir 'content.json'

# --- Lire les valeurs existantes (eyebrow, titre, bouton) ---
$existing = Get-Content $jsonFile -Raw | ConvertFrom-Json

# --- Scanner les dossiers projet numérotés ---
$projetFolders = Get-ChildItem $contentDir -Directory |
  Where-Object { $_.Name -match '^\d+\.' } |
  Sort-Object Name

if (-not $projetFolders) {
  Write-Host 'Aucun dossier projet trouvé (format attendu : "1. Lieu - Nom").' -ForegroundColor Yellow
  exit 0
}

$imgExtensions = @('.jpg', '.jpeg', '.png', '.webp')
$phaseNames    = @('Concept', 'Manufacturing', 'Commissioning')

$projets = [System.Collections.Generic.List[object]]::new()

foreach ($folder in $projetFolders) {

  # Nom du projet (sans le préfixe numérique)
  $nom = $folder.Name -replace '^\d+\.\s*', ''

  # Image de couverture : fichier nommé "titre" (insensible à la casse)
  $titreFile = Get-ChildItem $folder.FullName -Recurse -File |
    Where-Object { $_.BaseName -ieq 'titre' -and $_.Extension -iin $imgExtensions } |
    Select-Object -First 1

  if (-not $titreFile) {
    Write-Warning "[$nom] Aucune image 'titre' trouvée — projet ignoré."
    continue
  }

  $cover = $titreFile.FullName.Substring($contentDir.Length + 1).Replace('\', '/')

  # Phases
  $phases = [System.Collections.Generic.List[object]]::new()

  foreach ($phaseName in $phaseNames) {
    $phaseDir = Join-Path $folder.FullName $phaseName
    if (-not (Test-Path $phaseDir)) { continue }

    # Photo "titre" en premier (si présente), puis les autres alphabétiquement
    $titreInPhase = Get-ChildItem $phaseDir -File |
      Where-Object { $_.BaseName -ieq 'titre' -and $_.Extension -iin $imgExtensions } |
      Select-Object -First 1

    $autresPhotos = Get-ChildItem $phaseDir -File |
      Where-Object { $_.Extension -iin $imgExtensions -and $_.BaseName -ine 'titre' } |
      Sort-Object Name

    $tousLesFichiers = @()
    if ($titreInPhase) { $tousLesFichiers += $titreInPhase }
    $tousLesFichiers += $autresPhotos

    $photos = $tousLesFichiers | ForEach-Object {
      $_.FullName.Substring($contentDir.Length + 1).Replace('\', '/')
    }

    if (-not $photos) { continue }

    $phases.Add([PSCustomObject]@{
      nom    = $phaseName
      photos = @($photos)
    })
  }

  if ($phases.Count -eq 0) {
    Write-Warning "[$nom] Aucune phase avec photos — projet ignoré."
    continue
  }

  # Conserver la description existante si elle existe déjà dans le JSON
  $descExistante = ($existing.projets | Where-Object { $_.nom -eq $nom } | Select-Object -First 1).description
  if (-not $descExistante) { $descExistante = "Project description to be completed." }

  $projets.Add([PSCustomObject]@{
    nom         = $nom
    description = $descExistante
    cover       = $cover
    phases      = $phases.ToArray()
  })
}

# --- Construire le JSON final ---
$output = [PSCustomObject]@{
  eyebrow = $existing.eyebrow
  titre   = $existing.titre
  bouton  = $existing.bouton
  projets = $projets.ToArray()
}

$json = $output | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($jsonFile, $json, (New-Object System.Text.UTF8Encoding $false))

Write-Host "$($projets.Count) projet(s) exporté(s) dans content.json." -ForegroundColor Green
foreach ($p in $projets) {
  $phaseList = ($p.phases | ForEach-Object { $_.nom }) -join ', '
  Write-Host "  • $($p.nom)  [$phaseList]" -ForegroundColor Cyan
}
