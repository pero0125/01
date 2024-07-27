$appPath = "app2"
$adotPath = "adot"
$repoName = "nextjs-app4" # 変更した場合、cdkコード内の修正も必要
$awsAccountId = (aws sts get-caller-identity --query Account --output text)
$repoPath = (aws ecr describe-repositories --repository-names $repoName --query repositories[0].repositoryName --output text)

if ([string]::IsNullOrEmpty($repoPath)) {
    Write-Output "Trying to create $repoName repository..."
    aws ecr create-repository --repository-name $repoName
    $repoPath = (aws ecr describe-repositories --repository-names $repoName --query repositories[0].repositoryName --output text)
}
Write-Output "Repository Name: $repoPath"

aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin "$($awsAccountId).dkr.ecr.ap-northeast-1.amazonaws.com"

# app
docker build --no-cache -t next_app ./$appPath 

docker tag next_app:latest "$($awsAccountId).dkr.ecr.ap-northeast-1.amazonaws.com/$($repoName):latest"
docker push "$($awsAccountId).dkr.ecr.ap-northeast-1.amazonaws.com/$($repoName):latest"

# adot
docker build --no-cache -t next_app_adot ./$adotPath

docker tag next_app_adot:latest "$($awsAccountId).dkr.ecr.ap-northeast-1.amazonaws.com/$($repoName):adot"
docker push "$($awsAccountId).dkr.ecr.ap-northeast-1.amazonaws.com/$($repoName):adot"