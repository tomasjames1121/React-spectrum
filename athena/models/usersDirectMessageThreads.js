// @flow
const { db } = require('./db');

export const getDirectMessageThreadMembers = (
  id: string
): Promise<Array<Object>> => {
  return db
    .table('usersDirectMessageThreads')
    .getAll(id, { index: 'threadId' })
    .eqJoin('userId', db.table('users'))
    .without({ right: ['id', 'createdAt'] })
    .zip()
    .run();
};

export const getUserNotificationPermissionsInDirectMessageThread = (
  userId: string,
  threadId: string
): Promise<Boolean> => {
  return db
    .table('usersDirectMessageThreads')
    .getAll(userId, { index: 'userId' })
    .filter({ threadId })
    .run()
    .then(data => data.receiveNotifications);
};
