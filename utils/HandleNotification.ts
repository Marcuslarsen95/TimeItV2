import * as Notifications from "expo-notifications";

export default async function HandleNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  channelId: string,
  sound: string,
) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: sound,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
      repeats: false,
      channelId: channelId,
    },
  });
  return id;
}
