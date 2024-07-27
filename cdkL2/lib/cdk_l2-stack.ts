import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class CdkL2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPCの作成（パブリックサブネット1つのみ）
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });

    // ECSクラスタの作成
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc,
    });

    // ECRリポジトリの参照
    const repository = ecr.Repository.fromRepositoryName(this, 'NextJsRepository', 'nextjs-app');

    // タスクロールの作成
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'));
    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'));
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:*'],
      resources: ['*'],
    }));

    // タスク定義の作成
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'NextJsTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole,
    });

    // Next.jsコンテナの作成
    const nextJsContainer = taskDefinition.addContainer('NextJsContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, "latest"),
      logging: ecs.LogDrivers.awsLogs({ 
        streamPrefix: 'nextjs',
        logGroup: new logs.LogGroup(this, 'NextJsLogGroup', {
          logGroupName: 'my-nextjs-app-logs',
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
      }),
    });

    nextJsContainer.addPortMappings({
      containerPort: 8080,
    });

    // ADOTサイドカーコンテナの作成
    const adotContainer = taskDefinition.addContainer('AdotSidecar', {
      //image: ecs.ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
      image: ecs.ContainerImage.fromEcrRepository(repository, "adot"),
      logging: ecs.LogDrivers.awsLogs({ 
        streamPrefix: 'adot',
        logGroup: new logs.LogGroup(this, 'AdotLogGroup', {
          logGroupName: 'my-nextjs-adot-logs',
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
      }),
      command: ['--config=/otel-config.yaml'],
    });

    adotContainer.addPortMappings({
      containerPort: 4318, // HTTP port for OTLP
    });

    // ECSサービスの作成（ロードバランサーなし）
    const service = new ecs.FargateService(this, 'NextJsService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,  // Public IPを割り当てる
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },  // パブリックサブネットを使用
    });

    // セキュリティグループの設定（ポート3000を開放）
    service.connections.securityGroups[0].addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      'Allow HTTP traffic'
    );

    // ALBの作成（サブネットを指定）
    const lb = new elbv2.ApplicationLoadBalancer(this, 'MyLB', {
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnets: vpc.publicSubnets, // パブリックサブネットを指定
      },
    });

    // リスナーの作成
    const listener = lb.addListener('Listener', {
      port: 80,
      open: true,
    });

    // ターゲットグループの作成
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      targetType: elbv2.TargetType.IP,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/healthcheck',
        port: '8080',
        interval: cdk.Duration.seconds(10),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });
    // ECSサービスをターゲットグループに追加
    service.attachToApplicationTargetGroup(targetGroup);

    // ターゲットグループをリスナーに関連付け
    listener.addTargetGroups('EcsTargetGroup', {
      targetGroups: [targetGroup],
    });

    // CloudFormationの出力にALBのDNS名を追加
    new cdk.CfnOutput(this, 'LoadBalancerDNSRollDice', {
      value: cdk.Fn.join('', ['http://', lb.loadBalancerDnsName, '/rolldice']),
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNSS3', {
      value: cdk.Fn.join('', ['http://', lb.loadBalancerDnsName, '/s3buckets']),
    });
  }
}