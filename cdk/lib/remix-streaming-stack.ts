import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";

export class RemixStreamingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // *************************************
    // Configure Remix handler
    // *************************************
    const remixHandler = new nodejs.NodejsFunction(this, "RemixHandler", {
      entry: path.join(__dirname, "../../build/index.js"),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: "production",
      },
    });

    const functionUrl = remixHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // Invoke mode is not available in L2 construct yet
    const cfnUrl = functionUrl.node.defaultChild as lambda.CfnUrl;
    cfnUrl.invokeMode = "RESPONSE_STREAM";

    // *************************************
    // Configure Asset Bucket
    // *************************************
    const assetBucket = new s3.Bucket(this, "RemixAssetBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
    });

    // Use BucketDeployment for simplicity, for a production workload its better
    // to use something like github actions to deploy the Remix Handler + Assets
    new s3deploy.BucketDeployment(this, "DeployRemixAssets", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../public"))],
      destinationBucket: assetBucket,
    });

    // *************************************
    // Configure Cloutfront
    // *************************************

    const distribution = new cloudfront.Distribution(
      this,
      "RemixDistribution",
      {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        defaultBehavior: {
          origin: new cloudfront_origins.HttpOrigin(
            cdk.Fn.parseDomainName(functionUrl.url)
          ),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          cachePolicy: new cloudfront.CachePolicy(this, "ServerCache", {
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
            headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
              "Accept",
              "Accept-Language",
              "Authorization"
            ),
            cookieBehavior: cloudfront.CacheCookieBehavior.all(),
            defaultTtl: cdk.Duration.days(0),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.days(0),
            enableAcceptEncodingBrotli: true,
            enableAcceptEncodingGzip: true,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    const s3Origin = new cloudfront_origins.S3Origin(assetBucket);

    distribution.addBehavior("build/*", s3Origin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    distribution.addBehavior("favicon.ico", s3Origin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    // *************************************
    // Configure Outputs
    // *************************************
    new cdk.CfnOutput(this, "RemixHandlerFunctionName", {
      value: remixHandler.functionName,
    });
    new cdk.CfnOutput(this, "RemixHandlerFunctionUrl", {
      value: functionUrl.url,
    });
    new cdk.CfnOutput(this, "RemixDistributionDomain", {
      value: distribution.distributionDomainName,
    });
  }
}
