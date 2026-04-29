# Simple Politico Data Upload to S3
$BucketName = "ynk-techusa-politico-data"
$Region = "us-east-1"

Write-Host "Uploading Politico data to S3..." -ForegroundColor Cyan

# Disable block public access first
Write-Host "Configuring bucket access..." -ForegroundColor Yellow
aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" --region $Region 2>$null

# Configure public access policy
$policy = '{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::' + $BucketName + '/*"}]}'
$policyFile = "$env:TEMP\bucket-policy.json"
$policy | Out-File -FilePath $policyFile -Encoding ASCII -NoNewline

# Apply bucket policy
aws s3api put-bucket-policy --bucket $BucketName --policy "file://$policyFile" --region $Region

Write-Host "Uploading files..." -ForegroundColor Yellow

# Upload files without ACL (use bucket policy instead)
aws s3 sync ".\Politico" "s3://$BucketName/politico/" --region $Region --delete --exclude "*.xlsx"

Write-Host "`nUpload Complete!" -ForegroundColor Green
Write-Host "`nYour data is now at:" -ForegroundColor Cyan
Write-Host "https://$BucketName.s3.$Region.amazonaws.com/politico/" -ForegroundColor Yellow

$baseUrl = "https://$BucketName.s3.$Region.amazonaws.com/politico/drc_government_powerbi_star_schema_package/"
Write-Host "`nUpdate politico-data.js baseUrl to:" -ForegroundColor Cyan
Write-Host $baseUrl -ForegroundColor Yellow

Remove-Item $policyFile -ErrorAction SilentlyContinue
