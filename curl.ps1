$count = 100  # 実行回数を指定
$interval = 10  # 間隔を秒単位で指定

$i = 1
while ($i -le $count) {
    Write-Host "実行回数: $i"
    
    # ここに実行したいコマンドやスクリプトを記述
    curl http://CdkSta-MyLB5-cO7iK1RE70tr-1672628528.ap-northeast-1.elb.amazonaws.com/rolldice

    $i++
    
    if ($i -le $count) {
        Write-Host "次の実行まで $interval 秒待機します..."
        Start-Sleep -Seconds $interval
    }
}