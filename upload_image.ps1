$appPath = "app2"
$adotPath = "adot"
$awsAccountId = (aws sts get-caller-identity --query Account --output text)
$repoPath=(aws ecr describe-repositories --repository-names nextjs-app --query repositories[0].repositoryName --output text)

if ([string]::IsNullOrEmpty($repoPath)) {
    aws ecr describe-repositories --repository-names nextjs-app
}
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin "$awsAccountId.dkr.ecr.ap-northeast-1.amazonaws.com"

# app
docker build --no-cache -t next_app ./$appPath 

docker tag next_app:latest "$awsAccountId.dkr.ecr.ap-northeast-1.amazonaws.com/nextjs-app:latest"
docker push "$awsAccountId.dkr.ecr.ap-northeast-1.amazonaws.com/nextjs-app:latest"

# adot
docker build --no-cache -t next_app_adot ./$adotPath

docker tag next_app_adot:latest "$awsAccountId.dkr.ecr.ap-northeast-1.amazonaws.com/nextjs-app:adot"
docker push "$awsAccountId.dkr.ecr.ap-northeast-1.amazonaws.com/nextjs-app:adot"