// @flow
import React from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from 'src/components/avatar';
import { UserActions } from './components/userActions';
import { UserMeta } from './components/userMeta';
import {
  ProfileContainer,
  CoverPhoto,
  RoundProfileAvatarContainer,
} from './style';

export const UserProfileCard = (props: Props) => {
  const { user } = props;

  return (
    <ProfileContainer>
      <Link to={`/users/${user.username}`}>
        <CoverPhoto src={user.coverPhoto} />
      </Link>

      <RoundProfileAvatarContainer>
        <UserAvatar
          showHoverProfile={false}
          size={60}
          user={user}
          showOnlineStatus={false}
        />
      </RoundProfileAvatarContainer>

      <UserMeta user={user} />

      <UserActions user={user} />
    </ProfileContainer>
  );
};
