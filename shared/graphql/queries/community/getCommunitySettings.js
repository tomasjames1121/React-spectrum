// @flow
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import communityInfoFragment from '../../fragments/community/communityInfo';
import type { CommunityInfoType } from '../../fragments/community/communityInfo';
import communitySettingsFragment from '../../fragments/community/communitySettings';
import type { CommunitySettingsType } from '../../fragments/community/communitySettings';
import communityMetaDataFragment from '../../fragments/community/communityMetaData';
import type { CommunityMetaDataType } from '../../fragments/community/communityMetaData';

export type GetCommunitySettingsType = {
  ...$Exact<CommunityInfoType>,
  ...$Exact<CommunitySettingsType>,
};

export const getCommunitySettingsQuery = gql`
  query getCommunitySettings($id: ID) {
    community(id: $id) {
      ...communityInfo
      ...communityMetaData
      ...communitySettings
    }
  }
  ${communityInfoFragment}
  ${communitySettingsFragment}
  ${communityMetaDataFragment}
`;

const getCommunitySettingsOptions = {
  options: ({ id }) => ({
    variables: {
      id,
    },
    fetchPolicy: 'cache-and-network',
  }),
};

export const getCommunitySettingsByMatchQuery = gql`
  query getCommunitySettings($slug: String) {
    community(slug: $slug) {
      ...communityInfo
      ...communityMetaData
      ...communitySettings
    }
  }
  ${communityInfoFragment}
  ${communitySettingsFragment}
  ${communityMetaDataFragment}
`;

const getCommunitySettingsByMatchOptions = {
  options: ({ match: { params: { communitySlug } } }) => ({
    variables: {
      slug: communitySlug.toLowerCase(),
    },
    fetchPolicy: 'cache-and-network',
  }),
};

export const getCommunitySettingsByMatch = graphql(
  getCommunitySettingsByMatchQuery,
  getCommunitySettingsByMatchOptions
);

export default graphql(getCommunitySettingsQuery, getCommunitySettingsOptions);
