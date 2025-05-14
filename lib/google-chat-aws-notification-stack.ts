import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AlarmConstruct } from "./construct/alarm-construct";
import { NotificationConstruct } from "./construct/notification-construct";

export class GoogleChatAwsNotificationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const alarmConstruct = new AlarmConstruct(this, "AlarmConstruct");
    new NotificationConstruct(this, "NotificationConstruct", {
      alarm: alarmConstruct.alarm,
    });
  }
}
