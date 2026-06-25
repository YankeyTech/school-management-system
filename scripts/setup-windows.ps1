# ============================================================
# EduCore - Windows Setup Script (PowerShell)
# Run this in PowerShell as Administrator
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [string]$GitHubUser = "YankeyTech",
    [string]$RepoName = "school-management-system"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EduCore Setup Script" -ForegroundColor Cyan
Write-Host "  GitHub: $GitHubUser/$RepoName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Check Prerequisites ─────────────────────────────

Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Install from: https://nodejs.org (v18+)" -ForegroundColor Red
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Host "  ✅ Git found" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Git not found. Install from: https://git-scm.com" -ForegroundColor Red
    exit 1
}

# ─── Step 2: Create GitHub Repo ──────────────────────────────

Write-Host ""
Write-Host "[2/6] Creating GitHub repository..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "application/json"
}

$body = @{
    name = $RepoName
    description = "EduCore - Advanced Multi-Tenant School Management System for Ghanaian Schools"
    private = $false
    auto_init = $false
    has_issues = $true
    has_projects = $true
    has_wiki = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method POST -Headers $headers -Body $body
    Write-Host "  ✅ Repo created: $($response.html_url)" -ForegroundColor Green
    $repoUrl = $response.clone_url
} catch {
    $errorMsg = $_.Exception.Response
    if ($_.Exception.Message -like "*422*") {
        Write-Host "  ℹ️  Repo already exists, using existing repo" -ForegroundColor Yellow
        $repoUrl = "https://github.com/$GitHubUser/$RepoName.git"
    } else {
        Write-Host "  ❌ Failed to create repo: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# ─── Step 3: Clone & Set Up Local Project ────────────────────

Write-Host ""
Write-Host "[3/6] Setting up local project..." -ForegroundColor Yellow

$projectDir = "$env:USERPROFILE\Projects\educore"

if (Test-Path $projectDir) {
    Write-Host "  ℹ️  Directory exists, removing old version..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $projectDir
}

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\Projects" | Out-Null

# Extract the tar.gz
Write-Host "  📦 Extracting project files..." -ForegroundColor Cyan

# Check if we have the archive
$archivePath = "$PSScriptRoot\educore-architecture.tar.gz"
if (-not (Test-Path $archivePath)) {
    Write-Host "  ❌ educore-architecture.tar.gz not found next to this script" -ForegroundColor Red
    Write-Host "  Please put educore-architecture.tar.gz in the same folder as this script" -ForegroundColor Red
    exit 1
}

# Extract using tar (built into Windows 10+)
New-Item -ItemType Directory -Force -Path $projectDir | Out-Null
tar -xzf $archivePath -C $projectDir
Write-Host "  ✅ Files extracted to $projectDir" -ForegroundColor Green

# ─── Step 4: Git Init & Push ─────────────────────────────────

Write-Host ""
Write-Host "[4/6] Pushing to GitHub..." -ForegroundColor Yellow

Set-Location $projectDir

git init
git config user.email "dev@educore.app"
git config user.name "EduCore"
git branch -M main
git add .
git commit -m "🎓 Initial commit: EduCore School Management System

Complete multi-tenant SaaS for Ghanaian schools.

Features:
- Multi-school with Row Level Security
- Student, Teacher, Parent, Admin portals
- Attendance (manual + QR ready)
- Exams, Results, Report Cards
- Finance with Mobile Money layer
- Library, Hostel, Transport
- AI Assistant (OpenRouter)
- PDF report cards, Excel/CSV export
- Email notifications

Stack: Next.js 15, TypeScript, Supabase, Tailwind CSS"

# Set remote with token auth
$remoteUrl = "https://${GitHubToken}@github.com/$GitHubUser/$RepoName.git"
git remote add origin $remoteUrl
git push -u origin main --force

Write-Host "  ✅ Code pushed to GitHub!" -ForegroundColor Green
Write-Host "  🔗 https://github.com/$GitHubUser/$RepoName" -ForegroundColor Cyan

# ─── Step 5: Install Dependencies ────────────────────────────

Write-Host ""
Write-Host "[5/6] Installing dependencies..." -ForegroundColor Yellow

npm install

Write-Host "  ✅ Dependencies installed" -ForegroundColor Green

# ─── Step 6: Create .env.local ───────────────────────────────

Write-Host ""
Write-Host "[6/6] Creating environment file..." -ForegroundColor Yellow

$envContent = @"
# ============================================================
# EDUCORE - Environment Variables
# Fill in your Supabase credentials below
# ============================================================

# Get from: https://supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EduCore

# AI (optional - get free at openrouter.ai)
OPENROUTER_API_KEY=

# Email (optional - get free at resend.com)
RESEND_API_KEY=
EMAIL_FROM=EduCore <noreply@yourdomain.com>
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "  ✅ .env.local created" -ForegroundColor Green

# ─── Done! ───────────────────────────────────────────────────

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Project location: $projectDir" -ForegroundColor Cyan
Write-Host "🐙 GitHub repo: https://github.com/$GitHubUser/$RepoName" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Set up Supabase (FREE):" -ForegroundColor White
Write-Host "   → Go to https://supabase.com and create a project" -ForegroundColor Gray
Write-Host "   → Run the SQL from: supabase/migrations/001_initial_schema.sql" -ForegroundColor Gray
Write-Host "   → Run the seed from: supabase/seed/001_seed_data.sql" -ForegroundColor Gray
Write-Host "   → Copy your URL + keys into .env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the dev server:" -ForegroundColor White
Write-Host "   cd $projectDir" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "   → Open http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy to Vercel (FREE):" -ForegroundColor White
Write-Host "   npx vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "Need help? Check README.md in the project folder." -ForegroundColor Gray
Write-Host ""
