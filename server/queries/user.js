/**
 * Story query resolvers
 */
const { getUser, getUserMetaData, getAllStories } = require('../models/user');
const { getCommunitiesByUser } = require('../models/community');
const { getFrequenciesByUser } = require('../models/frequency');
const { getStoriesByUser } = require('../models/story');
const {
  getDirectMessageGroupsByUser,
} = require('../models/directMessageGroup');
const { getNotificationsByUser } = require('../models/notification');
import paginate from '../utils/paginate-arrays';
import { encode, decode } from '../utils/base64';
import type { PaginationOptions } from '../utils/paginate-arrays';
import type { GetUserArgs } from '../models/frequency';

module.exports = {
  Query: {
    user: (_, args: GetUserArgs) => getUser(args),
    currentUser: (_, __, { user }) => user,
  },
  User: {
    notificationConnection: (
      { uid }: { uid: String },
      { first = 10, after }: PaginationOptions,
      { user }: { user: Object }
    ) => {
      if (!user || user.uid !== uid) return null;
      return getNotificationsByUser(uid, { first, after });
    },
    everything: (
      { uid }: { uid: String },
      { first = 10, after }: PaginationOptions
    ) => {
      const cursor = decode(after);
      // TODO: Make this more performant by doing an actual db query rather than this hacking around
      return getFrequenciesByUser(uid)
        .then(frequencies =>
          getAllStories(frequencies.map(frequency => frequency.id))
        )
        .then(stories =>
          paginate(
            stories,
            { first, after: cursor },
            story => story.id === cursor
          )
        )
        .then(result => ({
          pageInfo: {
            hasNextPage: result.hasMoreItems,
          },
          edges: result.list.map(story => ({
            cursor: encode(story.id),
            node: story,
          })),
        }));
    },
    communityConnection: user => ({
      // Don't paginate communities and frequencies of a user
      pageInfo: {
        hasNextPage: false,
      },
      edges: getCommunitiesByUser(user.uid).then(communities =>
        communities.map(community => ({
          node: community,
        }))
      ),
    }),
    frequencyConnection: user => ({
      pageInfo: {
        hasNextPage: false,
      },
      edges: getFrequenciesByUser(user.uid).then(frequencies =>
        frequencies.map(frequency => ({
          node: frequency,
        }))
      ),
    }),
    directMessageGroupsConnection: user => ({
      pageInfo: {
        hasNextPage: false,
      },
      edges: getDirectMessageGroupsByUser(user.uid).then(groups =>
        groups.map(group => ({
          node: group,
        }))
      ),
    }),
    storyConnection: (
      { uid }: { uid: String },
      { first = 10, after }: PaginationOptions
    ) => {
      const cursor = decode(after);
      return getStoriesByUser(uid, { first, after: cursor })
        .then(stories =>
          paginate(
            stories,
            { first, after: cursor },
            story => story.id === cursor
          )
        )
        .then(result => ({
          pageInfo: {
            hasNextPage: result.hasMoreItems,
          },
          edges: result.list.map(story => ({
            cursor: encode(story.id),
            node: story,
          })),
        }));
    },
    metaData: ({ uid }: { uid: String }) => {
      return getUserMetaData(uid).then(data => {
        return {
          stories: data[0],
        };
      });
    },
  },
};
