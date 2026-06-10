<#
  Deploy LLMusic to the Hugging Face Space (https://huggingface.co/spaces/aynez/llmusic).

  Pushes a SINGLE clean commit to the Space's `main`, containing the app plus the
  three runtime data files, but WITHOUT the ~1 GB of build-only CSVs that live in
  this repo's history. HF Spaces have a 1 GB storage limit, so the full history
  (which includes those CSVs) cannot be pushed directly.

  Usage (from anywhere inside the repo):
      ./scripts/deploy-hf.ps1

  Requirements:
    * a git remote named `hf` pointing at the Space
    * a Hugging Face *write* token configured for that remote
    * a clean working tree on the branch you want to deploy (normally `main`)
#>
$ErrorActionPreference = 'Stop'

# Always operate from the repo root.
Set-Location (git rev-parse --show-toplevel)

$start = (git rev-parse --abbrev-ref HEAD).Trim()
if ($start -eq 'HEAD') { throw 'Detached HEAD - check out a branch (e.g. main) first.' }
if (git status --porcelain) { throw 'Working tree is not clean - commit or stash changes first.' }

# Delete the temp branch only if it exists (avoids git writing to stderr, which
# PowerShell 5.1 would otherwise turn into a terminating error).
function Remove-TempBranch {
    git show-ref --verify --quiet refs/heads/hf-temp
    if ($LASTEXITCODE -eq 0) { git branch -D hf-temp | Out-Null }
}

Remove-TempBranch

Write-Host "Building a clean deploy snapshot from '$start'..." -ForegroundColor Cyan
try {
    # An orphan branch is a single commit with no history, so the large CSVs in
    # this repo's past commits are never referenced and never uploaded to HF.
    git checkout --orphan hf-temp | Out-Null
    git rm -r --cached --quiet data/datasets data/training_dataset.parquet | Out-Null
    git commit -q -m "Deploy LLMusic ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))" | Out-Null

    Write-Host 'Pushing to Hugging Face (hf -> main)...' -ForegroundColor Cyan
    git push hf hf-temp:main --force
    if ($LASTEXITCODE -ne 0) { throw 'git push failed - see output above.' }

    Write-Host 'Pushed. The Space will rebuild automatically:' -ForegroundColor Green
    Write-Host '  https://huggingface.co/spaces/aynez/llmusic'
}
finally {
    # Always return to the original branch and remove the temp branch.
    git checkout -f $start | Out-Null
    Remove-TempBranch
}
