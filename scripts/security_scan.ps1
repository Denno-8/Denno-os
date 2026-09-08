# ==============================================================================
# Security Dependency Scan Script — Denno Career OS
# Performs automated vulnerability checks on Python and Node.js dependencies
# ==============================================================================

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReportFile = Join-Path $PSScriptRoot "security_report.txt"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Denno Career OS — Security Audit Scanner" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Set-Content -Path $ReportFile -Value "=========================================="
Add-Content -Path $ReportFile -Value " DENNO CAREER OS — SECURITY AUDIT REPORT"
Add-Content -Path $ReportFile -Value " Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Content -Path $ReportFile -Value "=========================================="
Add-Content -Path $ReportFile -Value ""

# 1. Backend Python Audit (pip-audit)
Write-Host "[1/2] Auditing Python backend dependencies..." -ForegroundColor Yellow
Add-Content -Path $ReportFile -Value "--- Python Backend Audit (pip-audit) ---"

$BackendDir = Join-Path $ProjectRoot "backend"
if (Test-Path "$BackendDir\requirements.txt") {
    try {
        $PipAuditOutput = python -m pip_audit -r "$BackendDir\requirements.txt" 2>&1
        Add-Content -Path $ReportFile -Value $PipAuditOutput
        Write-Host "  Python audit completed." -ForegroundColor Green
    } catch {
        Add-Content -Path $ReportFile -Value "pip-audit failed to execute or found vulnerabilities: $_"
        Write-Host "  Python audit reported issues or pip-audit is not installed." -ForegroundColor Yellow
    }
} else {
    Add-Content -Path $ReportFile -Value "backend/requirements.txt not found."
}

Add-Content -Path $ReportFile -Value ""

# 2. Frontend Node Audit (npm audit)
Write-Host "[2/2] Auditing Frontend Node dependencies..." -ForegroundColor Yellow
Add-Content -Path $ReportFile -Value "--- Frontend Node Audit (npm audit) ---"

$FrontendDir = Join-Path $ProjectRoot "frontend"
if (Test-Path "$FrontendDir\package.json") {
    try {
        Push-Location $FrontendDir
        $NpmAuditOutput = npm audit 2>&1
        Add-Content -Path $ReportFile -Value $NpmAuditOutput
        Pop-Location
        Write-Host "  Frontend npm audit completed." -ForegroundColor Green
    } catch {
        Pop-Location
        Add-Content -Path $ReportFile -Value "npm audit failed to execute: $_"
        Write-Host "  Frontend npm audit reported issues." -ForegroundColor Yellow
    }
} else {
    Add-Content -Path $ReportFile -Value "frontend/package.json not found."
}

Write-Host ""
Write-Host "Audit report saved to: $ReportFile" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
