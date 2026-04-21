<# ──────────────────────────────────────────────────────────
   YNK-TechUSA  —  Deploy Lambda + API Gateway + S3 backend
   Prerequisites: AWS CLI v2 configured  (aws configure)
   Run from the repo root:  .\deploy-aws.ps1
────────────────────────────────────────────────────────── #>

$ErrorActionPreference = "Continue"
$env:AWS_PAGER = ""

# ── CONFIG ───────────────────────────────────────────────
$REGION        = "us-east-1"
$BUCKET        = "ynk-techusa"
$FUNCTION_NAME = "ynk-techusa-api"
$ROLE_NAME     = "ynk-techusa-lambda-role"
$API_NAME      = "ynk-techusa-api"
$ACCOUNT_ID    = (aws sts get-caller-identity --query Account --output text).Trim()

Write-Host "`n=== YNK-TechUSA API Deployment ===" -ForegroundColor Cyan
Write-Host "Region:  $REGION"
Write-Host "Bucket:  $BUCKET"
Write-Host "Account: $ACCOUNT_ID`n"

# ── 1. Create IAM Role ──────────────────────────────────
Write-Host "[1/6] Creating IAM role..." -ForegroundColor Yellow

$trustPolicyFile = Join-Path $PSScriptRoot "lambda\trust-policy.json"
$s3PolicyFile = Join-Path $PSScriptRoot "lambda\s3-policy.json"

# Write policy files
$trustObj = @{
    Version = "2012-10-17"
    Statement = @(@{
        Effect = "Allow"
        Principal = @{ Service = "lambda.amazonaws.com" }
        Action = "sts:AssumeRole"
    })
}
$trustObj | ConvertTo-Json -Depth 5 | Set-Content -Path $trustPolicyFile -Encoding UTF8

$s3Obj = @{
    Version = "2012-10-17"
    Statement = @(@{
        Effect = "Allow"
        Action = @("s3:GetObject", "s3:PutObject")
        Resource = "arn:aws:s3:::$BUCKET/data/*"
    })
}
$s3Obj | ConvertTo-Json -Depth 5 | Set-Content -Path $s3PolicyFile -Encoding UTF8

try {
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document "file://$trustPolicyFile" --region $REGION --output text 2>$null | Out-Null
    Write-Host "  Created role $ROLE_NAME"
} catch {
    Write-Host "  Role $ROLE_NAME already exists - skipping"
}

# Attach policies
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" 2>$null

$policyName = "$FUNCTION_NAME-s3"
aws iam put-role-policy --role-name $ROLE_NAME --policy-name $policyName --policy-document "file://$s3PolicyFile" 2>$null

$ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/$ROLE_NAME"
Write-Host "  Role ARN: $ROLE_ARN"

# Wait for role propagation
Write-Host "  Waiting 10s for IAM propagation..."
Start-Sleep -Seconds 10

# ── 2. Package Lambda ───────────────────────────────────
Write-Host "[2/6] Packaging Lambda function..." -ForegroundColor Yellow

$zipPath = Join-Path $PSScriptRoot "lambda-deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Compress-Archive -Path (Join-Path $PSScriptRoot "lambda\index.mjs") -DestinationPath $zipPath -Force
Write-Host "  Created $zipPath"

# ── 3. Create/Update Lambda ─────────────────────────────
Write-Host "[3/6] Deploying Lambda function..." -ForegroundColor Yellow

$lambdaExists = $false
try {
    aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --output text 2>$null | Out-Null
    $lambdaExists = $true
} catch {}

$envVars = "Variables={BUCKET_NAME=$BUCKET}"

if ($lambdaExists) {
    aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file "fileb://$zipPath" --region $REGION --output text | Out-Null
    aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION 2>$null
    aws lambda update-function-configuration --function-name $FUNCTION_NAME --runtime nodejs20.x --handler index.handler --timeout 15 --memory-size 128 --environment $envVars --region $REGION --output text | Out-Null
    Write-Host "  Updated existing Lambda function"
} else {
    aws lambda create-function --function-name $FUNCTION_NAME --runtime nodejs20.x --handler index.handler --role $ROLE_ARN --zip-file "fileb://$zipPath" --timeout 15 --memory-size 128 --environment $envVars --region $REGION --output text | Out-Null
    Write-Host "  Created new Lambda function"
    aws lambda wait function-active-v2 --function-name $FUNCTION_NAME --region $REGION 2>$null
}

# ── 4. Create API Gateway HTTP API ──────────────────────
Write-Host "[4/6] Setting up API Gateway..." -ForegroundColor Yellow

$existingApi = (aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='$API_NAME'].ApiId" --output text 2>$null).Trim()

if ($existingApi -and $existingApi -ne "None" -and $existingApi -ne "") {
    $API_ID = $existingApi
    Write-Host "  Using existing API: $API_ID"
} else {
    $corsConfig = "AllowOrigins=*,AllowMethods=GET,POST,PATCH,OPTIONS,AllowHeaders=Content-Type"
    $API_ID = (aws apigatewayv2 create-api --name $API_NAME --protocol-type HTTP --cors-configuration $corsConfig --region $REGION --query "ApiId" --output text).Trim()
    Write-Host "  Created API: $API_ID"
}

# ── 5. Create Integration & Routes ──────────────────────
Write-Host "[5/6] Configuring routes..." -ForegroundColor Yellow

$LAMBDA_ARN = "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:$FUNCTION_NAME"

$existingInteg = (aws apigatewayv2 get-integrations --api-id $API_ID --region $REGION --query "Items[?IntegrationUri=='$LAMBDA_ARN'].IntegrationId" --output text 2>$null).Trim()

if ($existingInteg -and $existingInteg -ne "None" -and $existingInteg -ne "") {
    $INTEG_ID = $existingInteg
    Write-Host "  Using existing integration: $INTEG_ID"
} else {
    $INTEG_ID = (aws apigatewayv2 create-integration --api-id $API_ID --integration-type AWS_PROXY --integration-uri $LAMBDA_ARN --payload-format-version "2.0" --region $REGION --query "IntegrationId" --output text).Trim()
    Write-Host "  Created integration: $INTEG_ID"
}

$routes = @(
    "GET /api/data/{collection}",
    "POST /api/access-requests",
    "PATCH /api/access-requests/{id}",
    "POST /api/dynamic-codes",
    "POST /api/track",
    "POST /api/track-event"
)

$existingRoutes = aws apigatewayv2 get-routes --api-id $API_ID --region $REGION --query "Items[].RouteKey" --output text 2>$null

foreach ($route in $routes) {
    if ($existingRoutes -and $existingRoutes -match [regex]::Escape($route)) {
        Write-Host "  Route exists: $route"
    } else {
        aws apigatewayv2 create-route --api-id $API_ID --route-key $route --target "integrations/$INTEG_ID" --region $REGION --output text | Out-Null
        Write-Host "  Created route: $route"
    }
}

# Create default stage with auto-deploy
$stageQuery = "Items[?StageName==``" + '$default' + "``].StageName"
$stageExists = (aws apigatewayv2 get-stages --api-id $API_ID --region $REGION --query $stageQuery --output text 2>$null).Trim()

if (-not $stageExists -or $stageExists -eq "" -or $stageExists -eq "None") {
    aws apigatewayv2 create-stage --api-id $API_ID --stage-name '$default' --auto-deploy --region $REGION --output text | Out-Null
    Write-Host "  Created default stage with auto-deploy"
} else {
    Write-Host "  Default stage already exists"
}

# ── 6. Grant API Gateway permission to invoke Lambda ────
Write-Host "[6/6] Setting Lambda permissions..." -ForegroundColor Yellow

$sourceArn = "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*"
try {
    aws lambda add-permission --function-name $FUNCTION_NAME --statement-id "apigateway-invoke" --action "lambda:InvokeFunction" --principal "apigateway.amazonaws.com" --source-arn $sourceArn --region $REGION --output text 2>$null | Out-Null
    Write-Host "  Added invoke permission"
} catch {
    Write-Host "  Permission already exists - skipping"
}

# ── Done ─────────────────────────────────────────────────
$API_URL = "https://${API_ID}.execute-api.${REGION}.amazonaws.com"

Write-Host "`n=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "API URL: $API_URL" -ForegroundColor Cyan
Write-Host ""

# Update config files with the API URL
Write-Host "Updating config files..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot "ynk-react\.env"
Set-Content -Path $envPath -Value "VITE_API_URL=$API_URL" -Encoding UTF8
Write-Host "  Updated ynk-react/.env"

$adminDataPath = Join-Path $PSScriptRoot "Admin\admin-data.js"
$adminData = Get-Content $adminDataPath -Raw -Encoding UTF8
if ($adminData -match "apiUrl:\s*'[^']*'") {
    $adminData = $adminData -replace "apiUrl:\s*'[^']*'", "apiUrl: '$API_URL'"
    Set-Content -Path $adminDataPath -Value $adminData -NoNewline -Encoding UTF8
    Write-Host "  Updated Admin/admin-data.js"
} else {
    Write-Host "  WARNING: Could not find apiUrl in Admin/admin-data.js - update manually" -ForegroundColor Red
}

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Rebuild React app:  cd ynk-react; npm run build"
Write-Host "2. Commit and push:    git add -A; git commit -m 'Deploy S3 backend'; git push origin main"
Write-Host ("3. Test the API:       curl " + $API_URL + "/api/data/access-requests")
Write-Host ""

# Cleanup
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item $trustPolicyFile -Force -ErrorAction SilentlyContinue
Remove-Item $s3PolicyFile -Force -ErrorAction SilentlyContinue
