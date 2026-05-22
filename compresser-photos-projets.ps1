# ============================================================
#  Compression des photos de la section Projets
# ============================================================
#  Ce script réduit le poids des photos (souvent 3-8 MB depuis
#  un appareil photo) à environ 200-400 KB, sans perte visible
#  de qualité à l'écran.
#
#  Résultat typique : 5 MB → 250 KB (×20 plus rapide à charger)
#
#  Lancement :
#    Clic droit > "Exécuter avec PowerShell"
#  Options :
#    .\compresser-photos-projets.ps1               (max 1800px, qualité 75)
#    .\compresser-photos-projets.ps1 -MaxLargeur 1200  (plus petit encore)
#    .\compresser-photos-projets.ps1 -Backup       (garde .bak des originaux)
# ============================================================

param(
  [int]   $MaxLargeur = 1800,
  [int]   $Qualite    = 4,     # ffmpeg: 2=meilleur … 6=bon web (≈75% JPEG)
  [switch]$Backup
)

$ErrorActionPreference = 'Stop'

$racine     = $PSScriptRoot
$contentDir = Join-Path $racine 'public\content\projects'

# --- Localiser ffmpeg -------------------------------------------
$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ffmpeg) {
  $local = Join-Path $racine '..\ffmpeg-tools\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe'
  if (Test-Path $local) { $ffmpeg = $local }
}
if (-not $ffmpeg) {
  Write-Host 'ffmpeg introuvable. Installez-le ou placez-le dans ffmpeg-tools\.' -ForegroundColor Red
  exit 1
}

# --- Lister tous les fichiers images ----------------------------
$extensions = @('.jpg', '.jpeg', '.png', '.webp')
$fichiers   = Get-ChildItem $contentDir -Recurse -File |
              Where-Object { $_.Extension -iin $extensions }

if (-not $fichiers) {
  Write-Host 'Aucune image trouvée dans les dossiers projets.' -ForegroundColor Yellow
  exit 0
}

$total   = $fichiers.Count
$compte  = 0
$gagne   = 0L
$erreurs = 0

Write-Host "$total image(s) trouvée(s). Compression en cours...`n" -ForegroundColor Cyan

foreach ($f in $fichiers) {
  $compte++
  $avantOctets = $f.Length
  $tmp         = $f.FullName + '.__tmp.jpg'

  try {
    # Redimensionne si plus large que $MaxLargeur, compresse
    & $ffmpeg -i $f.FullName `
              -vf "scale='min($MaxLargeur,iw)':-2" `
              -q:v $Qualite `
              $tmp -y -loglevel error

    if (-not (Test-Path $tmp)) { throw 'Fichier temporaire absent' }

    $apresOctets = (Get-Item $tmp).Length

    if ($apresOctets -lt $avantOctets) {
      if ($Backup) {
        Copy-Item $f.FullName ($f.FullName + '.bak') -Force
      }
      Move-Item $tmp $f.FullName -Force
      $diff   = $avantOctets - $apresOctets
      $gagne += $diff
      $pct    = [math]::Round((1 - $apresOctets / $avantOctets) * 100)
      Write-Host ("  [{0}/{1}] {2,-40} {3,6}KB → {4,5}KB  (-{5}%)" -f `
        $compte, $total,
        $f.Name.Substring(0, [math]::Min(40, $f.Name.Length)),
        [math]::Round($avantOctets / 1KB),
        [math]::Round($apresOctets / 1KB),
        $pct) -ForegroundColor Green
    } else {
      Remove-Item $tmp -Force
      Write-Host ("  [{0}/{1}] {2,-40} déjà optimisée, ignorée" -f `
        $compte, $total,
        $f.Name.Substring(0, [math]::Min(40, $f.Name.Length))) -ForegroundColor DarkGray
    }
  } catch {
    if (Test-Path $tmp) { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
    Write-Host "  [ERREUR] $($f.Name) : $_" -ForegroundColor Red
    $erreurs++
  }
}

$gaineMB = [math]::Round($gagne / 1MB, 1)
Write-Host "`n✓ Terminé — $compte fichier(s) traité(s), ${gaineMB} MB récupérés." -ForegroundColor Cyan
if ($erreurs -gt 0) {
  Write-Host "  $erreurs erreur(s) — vérifiez les fichiers signalés." -ForegroundColor Yellow
}
