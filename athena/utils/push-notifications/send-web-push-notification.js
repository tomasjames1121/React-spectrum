// @flow
const debug = require('debug')('athena:utils:web-push');
import webPush from 'web-push';
import { removeSubscription } from '../../models/web-push-subscription';

try {
  webPush.setVapidDetails(
    'https://spectrum.chat',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('Web push notifications enabled!');
} catch (err) {}

export const sendWebPushNotification = (
  subscription: any,
  payload: Object | string,
  options?: ?Object
): Promise<Object> => {
  if (!subscription || !payload) {
    debug(
      'No subscription or payload provided to sendWebPushNotification, not pushing anything.'
    );
    return Promise.resolve({});
  }
  if (process.env.NODE_ENV === 'development') {
    debug('not sending web push notification in development');
    return Promise.resolve({});
  } else {
    debug('send web push notification');
  }

  const pl =
    typeof payload === 'string'
      ? payload
      : JSON.stringify({
          ...payload,
          raw: undefined,
        });
  return webPush
    .sendNotification(subscription, pl, {
      TTL: 86400, // Default TTL: One day
      ...options,
    })
    .catch(err => {
      if (err.statusCode === 410 && err.endpoint) {
        debug(`old subscription found (${err.endpoint}), removing`, err);
        return removeSubscription(err.endpoint);
      }
    });
};
