// @flow
import React from 'react';
//$FlowFixMe
import compose from 'recompose/compose';
//$FlowFixMe
import pure from 'recompose/pure';
//$FlowFixMe
import { Link } from 'react-router-dom';
//$FlowFixMe
import { connect } from 'react-redux';

import { toggleChannelSubscriptionMutation } from '../../api/channel';
import { addToastWithTimeout } from '../../actions/toasts';

import { NullCard } from '../upsell';
import { ChannelListItem } from '../listItems';
import Icon from '../icons';
import { Button } from '../buttons';
import { LoadingListItem } from '../loading';
import { MetaData } from './metaData';
import type { ProfileSizeProps } from './index';

import {
  ProfileHeader,
  ProfileHeaderLink,
  ProfileHeaderMeta,
  ProfileHeaderAction,
  Title,
  Subtitle,
  Description,
  Actions,
  Action,
  ProfileCard,
} from './style';

type ChannelProps = {
  id: string,
  name: string,
  slug: string,
  description: string,
  channelPermissions: Object,
  community: {
    slug: string,
    name: string,
    communityPermissions: Object,
  },
  metaData: {
    threads: number,
    subscribers: number,
  },
};

const ChannelWithData = props => {
  const {
    data: { channel, loading, error },
    data,
    profileSize,
    toggleChannelSubscription,
    dispatch,
    currentUser,
  } = props;

  const communityOwner = channel.community.communityPermissions.isOwner;
  const channelOwner = channel.channelPermissions.isOwner;
  const member = channel.channelPermissions.isMember;

  const componentSize = profileSize || 'mini';

  const toggleSubscription = (channelId: string) => {
    toggleChannelSubscription({ channelId })
      .then(({ data: { toggleChannelSubscription } }) => {
        const str = toggleChannelSubscription.channelPermissions.isMember
          ? `Joined ${toggleChannelSubscription.name} in ${toggleChannelSubscription.community.name}!`
          : `Left the channel ${toggleChannelSubscription.name} in ${toggleChannelSubscription.community.name}.`;

        const type = toggleChannelSubscription.channelPermissions.isMember
          ? 'success'
          : 'neutral';
        dispatch(addToastWithTimeout(type, str));
      })
      .catch(err => {
        dispatch(addToastWithTimeout('error', err.message));
      });
  };

  const returnAction = () => {
    if (communityOwner || channelOwner) {
      return (
        <Link to={`/${channel.community.slug}/${channel.slug}/settings`}>
          <ProfileHeaderAction
            glyph="settings"
            tipText={`Channel settings`}
            tipLocation="top-left"
          />
        </Link>
      );
    } else if (member) {
      return (
        <ProfileHeaderAction
          glyph="minus"
          color="text.placeholder"
          hoverColor="warn.default"
          tipText="Leave channel"
          tipLocation="top-left"
          onClick={() => toggleSubscription(channel.id)}
        />
      );
    } else if (currentUser && !member) {
      return (
        <ProfileHeaderAction
          glyph="plus-fill"
          color="brand.alt"
          hoverColor="brand.alt"
          tipText="Join channel"
          tipLocation="top-left"
          onClick={() => toggleSubscription(channel.id)}
        />
      );
    } else {
      return (
        <Link to={`/${channel.community.slug}/${channel.slug}`}>
          <ProfileHeaderAction glyph="view-forward" />
        </Link>
      );
    }
  };

  if (loading) {
    return <LoadingListItem />;
  } else if (error || !channel) {
    return (
      <NullCard
        bg="error"
        heading="Whoa there!"
        copy="This is uncharted space. Let's get you safely back home, huh?"
      >
        <Link to={'/home'}>
          <Button>Take me home</Button>
        </Link>
      </NullCard>
    );
  } else if (componentSize === 'full') {
    return (
      <ProfileCard>
        <ChannelListItem
          contents={channel}
          withDescription={true}
          meta={`${channel.community.name} / ${channel.name}`}
        >
          {returnAction()}
        </ChannelListItem>
        <MetaData data={channel.metaData} />
      </ProfileCard>
    );
  } else if (componentSize === 'mini') {
    return (
      <ProfileCard>
        <Link to={`/${channel.community.slug}/${channel.slug}`}>
          <ChannelListItem
            contents={channel}
            withDescription={false}
            meta={`${channel.community.name} / ${channel.name}`}
          >
            <Icon glyph="view-forward" />
          </ChannelListItem>
        </Link>
      </ProfileCard>
    );
  }
};

const Channel = compose(toggleChannelSubscriptionMutation, pure)(
  ChannelWithData
);

const mapStateToProps = state => ({
  currentUser: state.users.currentUser,
});

export default connect(mapStateToProps)(Channel);
