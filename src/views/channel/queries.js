// @flow
import { graphql, gql } from 'react-apollo';
import channelInfoFragment from 'shared/graphql/fragments/channel/channelInfo';
import communityInfoFragment from 'shared/graphql/fragments/community/communityInfo';
import communityMetaDataFragment from 'shared/graphql/fragments/community/communityMetaData';
import channelThreadConnectionFragment from 'shared/graphql/fragments/channel/channelThreadConnection';
import channelMetaDataFragment from 'shared/graphql/fragments/channel/channelMetaData';
import { subscribeToUpdatedThreads } from 'shared/graphql/subscriptions';
import parseRealtimeThreads from '../../helpers/realtimeThreads';

const LoadMoreThreads = gql`
  query loadMorechannelThreadConnection($id: ID, $after: String) {
    channel(id: $id) {
      ...channelInfo
      ...channelThreadConnection
    }
  }
  ${channelInfoFragment}
  ${channelThreadConnectionFragment}
`;

const threadsQueryOptions = {
  props: ({
    ownProps,
    data: {
      fetchMore,
      error,
      loading,
      channel,
      networkStatus,
      subscribeToMore,
    },
  }) => ({
    data: {
      error,
      loading,
      networkStatus,
      channel,
      threads: channel ? channel.threadConnection.edges : '',
      feed: channel && channel.id,
      hasNextPage: channel
        ? channel.threadConnection.pageInfo.hasNextPage
        : false,
      subscribeToUpdatedThreads: () => {
        return subscribeToMore({
          document: subscribeToUpdatedThreads,
          updateQuery: (prev, { subscriptionData }) => {
            const updatedThread = subscriptionData.data.threadUpdated;
            if (!updatedThread) return prev;

            const thisChannelId = ownProps.channelId;
            const updatedThreadShouldAppearInContext =
              thisChannelId === updatedThread.channel.id;

            const newThreads = updatedThreadShouldAppearInContext
              ? parseRealtimeThreads(
                  prev.channel.threadConnection.edges,
                  updatedThread,
                  ownProps.dispatch
                ).filter(thread => thread.node.channel.id === thisChannelId)
              : [...prev.channel.threadConnection.edges];

            return {
              ...prev,
              channel: {
                ...prev.channel,
                threadConnection: {
                  ...prev.channel.threadConnection,
                  pageInfo: {
                    ...prev.channel.threadConnection.pageInfo,
                  },
                  edges: newThreads,
                },
              },
            };
          },
        });
      },
      fetchMore: () =>
        fetchMore({
          query: LoadMoreThreads,
          variables: {
            after:
              channel.threadConnection.edges[
                channel.threadConnection.edges.length - 1
              ].cursor,
            id: channel.id,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult.channel) {
              return prev;
            }
            return {
              ...prev,
              channel: {
                ...prev.channel,
                threadConnection: {
                  ...prev.channel.threadConnection,
                  pageInfo: {
                    ...prev.channel.threadConnection.pageInfo,
                    ...fetchMoreResult.channel.threadConnection.pageInfo,
                  },
                  edges: [
                    ...prev.channel.threadConnection.edges,
                    ...fetchMoreResult.channel.threadConnection.edges,
                  ],
                },
              },
            };
          },
        }),
    },
  }),
  options: ({ id }) => ({
    variables: {
      id,
    },
    fetchPolicy: 'cache-and-network',
  }),
};

export const getChannelThreadConnection = graphql(
  gql`
    query getChannelThreadConnection($id: ID, $after: String) {
      channel(id: $id) {
        ...channelInfo
        ...channelThreadConnection
      }
    }
    ${channelInfoFragment}
    ${channelThreadConnectionFragment}
  `,
  threadsQueryOptions
);

/*
  Loads the sidebar profile component widget independent of the thread feed.
  In the future we can compose these queries together since they are fetching
  such similar data, but for now we're making a decision to keep the data
  queries specific to each component.
*/
const profileQueryOptions = {
  options: ({ match: { params: { channelSlug, communitySlug } } }) => ({
    variables: {
      channelSlug: channelSlug.toLowerCase(),
      communitySlug: communitySlug.toLowerCase(),
    },
    fetchPolicy: 'cache-first',
  }),
};

export const getChannel = graphql(
  gql`
    query getChannel($channelSlug: String, $communitySlug: String) {
      channel(channelSlug: $channelSlug, communitySlug: $communitySlug) {
        ...channelInfo
        ...channelMetaData
        community {
          ...communityInfo
          ...communityMetaData
        }
      }
    }
    ${channelInfoFragment}
    ${communityInfoFragment}
    ${communityMetaDataFragment}
    ${channelMetaDataFragment}
  `,
  profileQueryOptions
);
