// @flow
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import channelInfoFragment from 'shared/graphql/fragments/channel/channelInfo';
import channelMetaDataFragment from 'shared/graphql/fragments/channel/channelMetaData';

const getChannelByIdQuery = gql`
  query getChannel($id: ID) {
    channel(id: $id) {
      ...channelInfo
      ...channelMetaData
    }
  }
  ${channelInfoFragment}
  ${channelMetaDataFragment}
`;

const getChannelByIdOptions = {
  options: ({ id }) => ({
    variables: {
      id,
    },
  }),
};

export const getChannelById = graphql(
  getChannelByIdQuery,
  getChannelByIdOptions
);

/*
  Alternative implementation that takes a channel slug and community slug
  to perform a lookup
  Used to check for duplicate channel names during channel creation, and can
  be used as a way to get a channel based on url params.
*/
const getChannelBySlugAndCommunitySlugQuery = gql`
  query getChannel($channelSlug: String, $communitySlug: String) {
    channel(channelSlug: $channelSlug, communitySlug: $communitySlug) {
      ...channelInfo
      ...channelMetaData
    }
  }
  ${channelInfoFragment}
  ${channelMetaDataFragment}
`;

const getChannelBySlugAndCommunitySlugOptions = {
  options: ({ channelSlug, communitySlug }) => ({
    variables: {
      channelSlug: channelSlug.toLowerCase(),
      communitySlug: communitySlug.toLowerCase(),
    },
  }),
};

export const getChannelBySlugAndCommunitySlug = graphql(
  getChannelBySlugAndCommunitySlugQuery,
  getChannelBySlugAndCommunitySlugOptions
);

const getChannelByMatchOptions = {
  options: ({ match: { params: { channelSlug, communitySlug } } }) => ({
    variables: {
      channelSlug: channelSlug.toLowerCase(),
      communitySlug: communitySlug.toLowerCase(),
    },
  }),
};

export const getChannelByMatch = graphql(
  getChannelBySlugAndCommunitySlugQuery,
  getChannelByMatchOptions
);
