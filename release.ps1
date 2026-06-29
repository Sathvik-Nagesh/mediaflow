param (
    [ValidateSet("patch", "minor", "major")]
    [string]$Type = "patch"
)

Write-Host "Releasing new $Type version..." -ForegroundColor Cyan

# 1. Bump version in package.json
Write-Host "Bumping version in package.json..." -ForegroundColor Yellow
npm version $Type --no-git-tag-version

# Get the new version
$Version = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "New version is v$Version" -ForegroundColor Green

# 2. Update version in tauri.conf.json
Write-Host "Updating tauri.conf.json..." -ForegroundColor Yellow
$TauriConfPath = "src-tauri\tauri.conf.json"
$TauriConf = Get-Content $TauriConfPath | ConvertFrom-Json
$TauriConf.version = $Version
$TauriConf | ConvertTo-Json -Depth 10 | Set-Content $TauriConfPath

# 3. Update version in Cargo.toml
Write-Host "Updating Cargo.toml..." -ForegroundColor Yellow
$CargoTomlPath = "src-tauri\Cargo.toml"
$CargoToml = Get-Content $CargoTomlPath
$CargoToml = $CargoToml -replace '(?m)^version\s*=\s*".*"', "version = `"$Version`""
$CargoToml | Set-Content $CargoTomlPath

# 4. Build the Tauri app
Write-Host "Building Tauri application. This may take a few minutes..." -ForegroundColor Yellow
npm run tauri build

# 5. Commit and Tag
Write-Host "Committing and tagging v$Version..." -ForegroundColor Yellow
git add package.json package-lock.json src-tauri\tauri.conf.json src-tauri\Cargo.toml
git commit -m "chore(release): bump version to v$Version"
git tag "v$Version"

# 6. Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
git push origin "v$Version"

# 7. Create GitHub release and upload binaries
Write-Host "Creating GitHub Release and uploading binaries..." -ForegroundColor Yellow
$ExePath = "src-tauri\target\release\bundle\nsis\mediaflow_$Version`_x64-setup.exe"
$MsiPath = "src-tauri\target\release\bundle\msi\mediaflow_$Version`_x64_en-US.msi"

if (Get-Command gh -ErrorAction SilentlyContinue) {
    gh release create "v$Version" $ExePath $MsiPath --title "MediaFlow v$Version" --generate-notes
    Write-Host "Release created successfully!" -ForegroundColor Green
} else {
    Write-Host "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/ to automate the release upload." -ForegroundColor Red
    Write-Host "You can manually upload these files to GitHub:"
    Write-Host "- $ExePath"
    Write-Host "- $MsiPath"
}
