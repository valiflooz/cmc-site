# ============================================================
#  Ré-extraction des images de la vidéo de la section "À propos"
# ============================================================
#  Quand l'utiliser : après avoir remplacé le fichier
#      public\content\about\welder.mp4
#  Ce script découpe la vidéo en images (frames) que le site
#  fait défiler au scroll, et met à jour automatiquement
#  "nombreFrames" dans public\content\about\content.json.
#
#  Lancement : clic droit sur le fichier > "Exécuter avec PowerShell"
#  Ou en ligne de commande :   .\extraire-frames-about.ps1
#  Pour changer la fluidité :  .\extraire-frames-about.ps1 -Fps 8
#      (plus de fps = plus fluide mais défile plus vite ; 6 par défaut)
# ============================================================

param(
  [int]$Fps     = 12,   # images par seconde extraites (12 = ~60 frames / 5s, 24 = ~120 frames)
  [int]$Quality = 2,    # qualité JPEG : 1 = max, 31 = min (2 = très haute qualité)
  [int]$Width   = 1280  # largeur en pixels (-2 = hauteur auto pour garder le ratio)
)

$ErrorActionPreference = 'Stop'
$racine = $PSScriptRoot
$video  = Join-Path $racine 'public\content\about\welder.mp4'
$frames = Join-Path $racine 'public\content\about\frames'
$json   = Join-Path $racine 'public\content\about\content.json'

# --- Localiser ffmpeg ---------------------------------------
$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ffmpeg) {
  $local = Join-Path $racine '..\ffmpeg-tools\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe'
  if (Test-Path $local) { $ffmpeg = $local }
}
if (-not $ffmpeg) {
  Write-Host 'ffmpeg introuvable. Installez-le ou placez-le dans le dossier ffmpeg-tools.' -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $video)) {
  Write-Host "Video absente : $video" -ForegroundColor Red
  exit 1
}

# --- Vider le dossier des frames ----------------------------
New-Item -ItemType Directory -Force -Path $frames | Out-Null
Get-ChildItem $frames -Filter *.jpg | Remove-Item -Force

# --- Extraction ---------------------------------------------
Write-Host "Extraction des images ($Fps fps, qualite=$Quality, largeur=$Width px)..." -ForegroundColor Cyan
& $ffmpeg -i $video -vf "fps=$Fps,scale=${Width}:-2" -q:v $Quality (Join-Path $frames 'frame-%03d.jpg') -y

# --- Mettre a jour content.json -----------------------------
$nb = (Get-ChildItem $frames -Filter *.jpg).Count
$txt = Get-Content $json -Raw
$txt = $txt -replace '("nombreFrames"\s*:\s*)\d+', "`${1}$nb"
[System.IO.File]::WriteAllText($json, $txt, (New-Object System.Text.UTF8Encoding $false))

Write-Host "$nb images extraites a ${Width}px (q=$Quality). content.json mis a jour (nombreFrames = $nb)." -ForegroundColor Green
