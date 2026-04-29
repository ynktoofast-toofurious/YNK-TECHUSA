# Upload Politico Data to AWS S3
# This script uploads the DRC Government Politico data folder to S3 for hosting

param(
    [Parameter(Mandatory=$false)]
    [string]$BucketName = "ynk-techusa-politico-data",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "default"
)

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Failure { Write-Host $args -ForegroundColor Red }

Write-Info "═══════════════════════════════════════════════════════"
Write-Info "  Politico Data S3 Upload Script"
Write-Info "═══════════════════════════════════════════════════════"
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version
    Write-Success "✓ AWS CLI is installed: $awsVersion"
} catch {
    Write-Failure "✗ AWS CLI is not installed or not in PATH"
    Write-Info "Please install AWS CLI from: https://aws.amazon.com/cli/"
    exit 1
}

# Set the source directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceDir = Join-Path $ScriptDir "Politico"

if (-not (Test-Path $SourceDir)) {
    Write-Failure "✗ Politico folder not found at: $SourceDir"
    exit 1
}

Write-Success "✓ Source directory found: $SourceDir"
Write-Host ""

# Check if bucket exists
Write-Info "Checking if S3 bucket exists..."
$bucketExists = $false
try {
    aws s3 ls "s3://$BucketName" --profile $Profile --region $Region 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $bucketExists = $true
        Write-Success "✓ Bucket '$BucketName' exists"
    }
} catch {
    # Bucket doesn't exist
}

# Create bucket if it doesn't exist
if (-not $bucketExists) {
    Write-Info "Creating S3 bucket: $BucketName"
    try {
        if ($Region -eq "us-east-1") {
            aws s3 mb "s3://$BucketName" --profile $Profile --region $Region
        } else {
            aws s3 mb "s3://$BucketName" --profile $Profile --region $Region --create-bucket-configuration LocationConstraint=$Region
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ Bucket created successfully"
        } else {
            Write-Failure "✗ Failed to create bucket"
            exit 1
        }
    } catch {
        Write-Failure "✗ Error creating bucket: $_"
        exit 1
    }
}

Write-Host ""
Write-Info "Configuring bucket for public read access (for website hosting)..."

# Create bucket policy for public read access
$policyJson = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BucketName/*"
        }
    ]
}
"@

$policyFile = Join-Path $env:TEMP "bucket-policy.json"
$policyJson | Out-File -FilePath $policyFile -Encoding UTF8

try {
    # Disable block public access
    aws s3api put-public-access-block `
        --bucket $BucketName `
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" `
        --profile $Profile `
        --region $Region
    
    # Apply bucket policy
    aws s3api put-bucket-policy `
        --bucket $BucketName `
        --policy file://$policyFile `
        --profile $Profile `
        --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✓ Bucket configured for public read access"
    }
    
    Remove-Item $policyFile -ErrorAction SilentlyContinue
} catch {
    Write-Warning "⚠ Could not configure public access. You may need to do this manually in the AWS Console."
}

Write-Host ""
Write-Info "Uploading Politico data to S3..."
Write-Info "Bucket: s3://$BucketName"
Write-Info "Source: $SourceDir"
Write-Host ""

# Upload files
try {
    aws s3 sync $SourceDir "s3://$BucketName/politico/" `
        --profile $Profile `
        --region $Region `
        --delete `
        --acl public-read `
        --exclude "*.md" `
        --exclude "README*" `
        --cache-control "max-age=3600" `
        --content-type "text/csv"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "✓ Upload completed successfully!"
    } else {
        Write-Failure "✗ Upload failed"
        exit 1
    }
} catch {
    Write-Failure "✗ Error during upload: $_"
    exit 1
}

Write-Host ""
Write-Info "═══════════════════════════════════════════════════════"
Write-Success "  Upload Complete!"
Write-Info "═══════════════════════════════════════════════════════"
Write-Host ""
Write-Info "Your Politico data is now hosted at:"
Write-Success "https://$BucketName.s3.$Region.amazonaws.com/politico/"
Write-Host ""
Write-Info "To use this data in your admin portal, update the baseUrl in:"
Write-Info "Admin/politico-data.js"
Write-Host ""
Write-Info "Change this line:"
Write-Warning "  const baseUrl = '../Politico/drc_government_powerbi_star_schema_package/';"
Write-Host ""
Write-Info "To:"
Write-Success "  const baseUrl = 'https://$BucketName.s3.$Region.amazonaws.com/politico/drc_government_powerbi_star_schema_package/';"
Write-Host ""

# Optional: Enable CORS for cross-origin access
$enableCors = Read-Host "Enable CORS for cross-origin access? (y/n)"
if ($enableCors -eq 'y' -or $enableCors -eq 'Y') {
    $corsJson = @"
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": [],
            "MaxAgeSeconds": 3600
        }
    ]
}
"@
    
    $corsFile = Join-Path $env:TEMP "cors-policy.json"
    $corsJson | Out-File -FilePath $corsFile -Encoding UTF8
    
    try {
        aws s3api put-bucket-cors `
            --bucket $BucketName `
            --cors-configuration file://$corsFile `
            --profile $Profile `
            --region $Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ CORS enabled successfully"
        }
        
        Remove-Item $corsFile -ErrorAction SilentlyContinue
    } catch {
        Write-Warning "⚠ Could not enable CORS: $_"
    }
}

Write-Host ""
Write-Info "Done!"
