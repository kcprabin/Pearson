#Requires -Version 5.1
param(
    [Alias("b")]
    [switch]$Build
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Write-Step($Title) {
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

function Fail($Message) {
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

# --- STEP 1: Prerequisites ----------------------------------------------------
Write-Step "STEP 1 - Checking Prerequisites"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail "Docker is not installed or not in PATH."
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Fail "Docker Desktop is not running. Please start Docker Desktop first."
}
docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    Fail "Docker Compose (v2) is not available."
}
Write-Host "[OK] Docker and Docker Compose ready." -ForegroundColor Green

# --- STEP 2: Smart Build & Launch ---------------------------------------------
Write-Step "STEP 2 - Starting All Containers"
$NeedBuild = $false
$BuildReason = ""
$Images = @("pearson-agent", "pearson-api", "pearson-web")

if ($Build) {
    $NeedBuild = $true
    $BuildReason = "-Build flag passed"
}

if (-not $NeedBuild) {
    foreach ($img in $Images) {
        docker image inspect "${img}:latest" *> $null
        if ($LASTEXITCODE -ne 0) {
            $NeedBuild = $true
            $BuildReason = "image '$img' not found"
            break
        }
    }
}

if (-not $NeedBuild -and (Get-Command git -ErrorAction SilentlyContinue)) {
    git rev-parse --git-dir *> $null
    if ($LASTEXITCODE -eq 0) {
        $Changed = git status --short -- services/ apps/ packages/ Dockerfile "*/Dockerfile" docker-compose.yml docker-compose.yaml "*/requirements*.txt" "*/package.json" "*/pyproject.toml" 2>$null | Where-Object { $_ -notmatch '^\?' }
        if ($Changed) {
            $NeedBuild = $true
            $BuildReason = "uncommitted source changes detected"
        }

        if (-not $NeedBuild) {
            $YoungestImage = [DateTimeOffset]::MinValue
            foreach ($img in $Images) {
                $CreatedRaw = docker inspect --format='{{.Created}}' "${img}:latest" 2>$null
                if ($CreatedRaw) {
                    $Dt = [DateTimeOffset]::Parse($CreatedRaw)
                    if ($Dt -gt $YoungestImage) { $YoungestImage = $Dt }
                }
            }
            $LastCommitRaw = git log -1 --format=%cI -- services/ apps/ packages/ docker-compose.yml "*/Dockerfile" 2>$null
            if ($LastCommitRaw -and ([DateTimeOffset]::Parse($LastCommitRaw) -gt $YoungestImage)) {
                $NeedBuild = $true
                $BuildReason = "new commits since last image build"
            }
        }
    }
}

if ($NeedBuild) {
    Write-Host "[BUILD] Building images (reason: $BuildReason) and starting containers..." -ForegroundColor Yellow
    docker compose up -d --build
} else {
    Write-Host "[CACHE] No changes detected - starting with cached images (pass -Build to force rebuild)..." -ForegroundColor Green
    docker compose up -d --no-build
}
if ($LASTEXITCODE -ne 0) { Fail "Failed to start containers." }
Write-Host "[OK] All containers launched." -ForegroundColor Green

# --- STEP 3: Health Check -----------------------------------------------------
Write-Step "STEP 3 - Health Check - Waiting for Containers"
$MaxWait = 120
$Interval = 3

foreach ($C in @("pearson-postgres", "pearson-kafka")) {
    $Elapsed = 0
    Write-Host ("  {0,-25}" -f $C) -NoNewline
    while ($true) {
        $St = (docker inspect --format='{{.State.Health.Status}}' $C 2>$null)
        if (-not $St) { $St = "missing" }
        if ($St -eq "healthy") {
            Write-Host "[OK] healthy" -ForegroundColor Green
            break
        }
        if ($St -eq "unhealthy" -or $Elapsed -ge $MaxWait) {
            Write-Host "[FAIL] $St" -ForegroundColor Red
            docker logs --tail=30 $C
            Fail "Container '$C' failed healthcheck."
        }
        Start-Sleep -Seconds $Interval
        $Elapsed += $Interval
        Write-Host "." -NoNewline
    }
}

foreach ($C in @("pearson-agent", "pearson-api", "pearson-web")) {
    $St = (docker inspect --format='{{.State.Status}}' $C 2>$null)
    if (-not $St) { $St = "missing" }
    Write-Host ("  {0,-25}" -f $C) -NoNewline
    if ($St -eq "running") {
        Write-Host "[OK] running" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $St" -ForegroundColor Red
        docker logs --tail=30 $C
        Fail "'$C' not running."
    }
}
Write-Host "`n[OK] All containers are up and healthy!" -ForegroundColor Green

# --- STEP 4: Gemini API Key & .env Setup --------------------------------------
Write-Step "STEP 4 - Gemini API Key & .env Setup"
$EnvFile = Join-Path $ProjectRoot ".env"
$ExistingKey = $null

if (Test-Path $EnvFile) {
    $Match = Select-String -Path $EnvFile -Pattern '^GOOGLE_API_KEY=(.+)' | Select-Object -First 1
    if ($Match) { $ExistingKey = $Match.Matches.Groups[1].Value.Trim() }
}

if ($ExistingKey) {
    Write-Host "[OK] GOOGLE_API_KEY already set in .env - skipping setup." -ForegroundColor Green
} else {
    $UserKey = Read-Host "Enter your GOOGLE_API_KEY"
    if ([string]::IsNullOrWhiteSpace($UserKey)) { Fail "No API key entered." }

    @"
PORT=3000
POSTGRES_USER=pearson
POSTGRES_PASSWORD=pearson_dev_password
POSTGRES_DB=pearson
DATABASE_URL=postgresql://pearson:pearson_dev_password@localhost:5432/pearson
KAFKA_BROKERS=localhost:9092
AGENT_URL=http://agent:8000
PINECONE_API_KEY=REPLACE_WITH_YOUR_PINECONE_KEY
GOOGLE_API_KEY=$($UserKey.Trim())
"@ | Set-Content -Path $EnvFile -Encoding UTF8

    Write-Host "[OK] .env written - recreating agent & api..." -ForegroundColor Green
    docker compose up -d --force-recreate agent api
}

# --- STEP 5: WhatsApp Pairing & Restaurant First Login ------------------------
Write-Step "STEP 5 - WhatsApp Pairing & Restaurant First Login"

$InitialLogs = docker logs --tail=300 pearson-api 2>&1 | Out-String
if ($InitialLogs -match "Connected to WhatsApp as bot\.") {
    Write-Host "[OK] WhatsApp already connected (receiver & bot).`n" -ForegroundColor Green
} else {
    Write-Host "Waiting for WhatsApp connection - if unpaired, QR codes will appear below:`n" -ForegroundColor Yellow

    $LogJob = Start-Job -ScriptBlock {
        docker logs -f --tail=50 pearson-api 2>&1
    }

    try {
        $Wait = 0
        $PairTimeout = 180
        $Connected = $false

        while (-not $Connected) {
            Receive-Job -Job $LogJob | ForEach-Object {
                $Line = $_.ToString()
                Write-Host $Line
                if ($Line -match "(?i)qr ready") {
                    $Role = "WHATSAPP"; $Color = "Green"
                    if ($Line -match "(?i)receiver") { $Role = "RECEIVER"; $Color = "Cyan" }
                    elseif ($Line -match "(?i)bot") { $Role = "BOT" }
                    Write-Host "`n===========================================================" -ForegroundColor $Color
                    Write-Host "  [QR] SCAN $Role QR CODE ABOVE IN WHATSAPP" -ForegroundColor $Color
                    Write-Host "===========================================================`n" -ForegroundColor $Color
                }
                if ($Line -match "Connected to WhatsApp as bot\.") {
                    $Connected = $true
                }
            }

            if ($Connected) { break }
            if ($Wait -ge $PairTimeout) {
                Fail "Timed out waiting for WhatsApp pairing. Re-run .\scripts\start.ps1 to scan QR."
            }
            Start-Sleep -Seconds 2
            $Wait += 2
        }
    } finally {
        Stop-Job -Job $LogJob -ErrorAction SilentlyContinue
        Remove-Job -Job $LogJob -Force -ErrorAction SilentlyContinue
    }
    Write-Host "`n[OK] Both Receiver and Bot WhatsApp sessions are connected!`n" -ForegroundColor Green
}

$RPhone = Read-Host "Restaurant phone number (10-15 digits)"
if ($RPhone -notmatch '^[0-9]{10,15}$') { Fail "Phone number must be 10 to 15 digits." }

try {
    $CheckResp = Invoke-RestMethod -Uri "http://localhost:3000/hotel/checkuser" -Method Post -ContentType "application/json" -Body (@{ phoneNumber = $RPhone } | ConvertTo-Json)
} catch {
    Fail "Failed /hotel/checkuser: $_"
}

if ($CheckResp.exists -eq $true) {
    Write-Host "[OK] Restaurant already registered for $RPhone - skipping onboarding." -ForegroundColor Yellow
    $ApiLogs = docker logs --tail=500 pearson-api 2>&1 | Out-String
    $CredMatches = [regex]::Matches($ApiLogs, 'username=[^,\s]+,\s*password=[^\s]+')
    if ($CredMatches.Count -gt 0) {
        Write-Host "  Last logged credentials: $($CredMatches[$CredMatches.Count - 1].Value)" -ForegroundColor Cyan
    }
} else {
    $RName  = Read-Host "Restaurant name"
    $OName  = Read-Host "Owner name"
    $OPhone = Read-Host "Owner phone number (optional)"
    $RAddr  = Read-Host "Restaurant address (optional)"
    $REmail = Read-Host "Restaurant email (optional)"
    $OEmail = Read-Host "Owner email (optional)"

    if ([string]::IsNullOrWhiteSpace($RName) -or [string]::IsNullOrWhiteSpace($OName)) {
        Fail "Restaurant name and owner name are required."
    }

    $PayloadObj = @{
        restaurantName = $RName
        ownerName      = $OName
        phoneNumber    = $RPhone
    }
    if ($OPhone) { $PayloadObj.ownerPhoneNumber = $OPhone }
    if ($RAddr)  { $PayloadObj.address          = $RAddr }
    if ($REmail) { $PayloadObj.email            = $REmail }
    if ($OEmail) { $PayloadObj.ownerEmail       = $OEmail }

    try {
        $Resp = Invoke-RestMethod -Uri "http://localhost:3000/hotel/first-login" -Method Post -ContentType "application/json" -Body ($PayloadObj | ConvertTo-Json)
    } catch {
        Fail "Failed /hotel/first-login: $_"
    }

    $Data = if ($Resp.data.data) { $Resp.data.data } elseif ($Resp.data) { $Resp.data } else { $null }
    $Creds = if ($Data -and ($Data.username -or $Data.password)) {
        "username=$($Data.username), password=$($Data.password) (Thread ID: $($Resp.convo_Id))"
    } else {
        "Check pearson-api logs below"
    }

    Write-Host "`n===========================================================" -ForegroundColor Green
    Write-Host "  [KEY] RESTAURANT LOGIN CREDENTIALS" -ForegroundColor Green
    Write-Host "  $Creds" -ForegroundColor Green
    Write-Host "===========================================================" -ForegroundColor Green
}

# --- STEP 6: Live Container Logs (Runs Until Ctrl+C) -------------------------
Write-Step "STEP 6 - Live Container Logs"
Write-Host "Web: http://localhost:5173 | API: http://localhost:3000 | Agent: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Running continuously - press Ctrl+C to shut down all containers and exit.`n" -ForegroundColor Yellow

try {
    docker compose logs -f --tail=100 agent api web | ForEach-Object {
        $Line = $_.ToString()
        Write-Host $Line
        if ($Line -match "(?i)qr ready") {
            $Role = "WHATSAPP"; $Color = "Green"
            if ($Line -match "(?i)receiver") { $Role = "RECEIVER"; $Color = "Cyan" }
            elseif ($Line -match "(?i)bot") { $Role = "BOT" }
            Write-Host "`n===========================================================" -ForegroundColor $Color
            Write-Host "  [QR] $Role QR CODE IS COMING - scan in WhatsApp" -ForegroundColor $Color
            Write-Host "===========================================================`n" -ForegroundColor $Color
        } elseif ($Line -match "Generated restaurant login credentials: (.+)") {
            Write-Host "`n===========================================================" -ForegroundColor Yellow
            Write-Host "  [KEY] CREDENTIALS: $($Matches[1])" -ForegroundColor Yellow
            Write-Host "===========================================================`n" -ForegroundColor Yellow
        }
    }
} finally {
    Write-Host "`n`n[STOP] Stopping and removing all containers..." -ForegroundColor Yellow
    docker compose down
    Write-Host "[OK] All containers stopped." -ForegroundColor Green
}