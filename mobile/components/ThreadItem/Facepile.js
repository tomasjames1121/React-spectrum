// @flow
import * as React from 'react';
import Avatar from '../Avatar';
import { FacepileContainer, EmptyParticipantHead } from './style';
const NUM_TO_DISPLAY = 5;

const messageAvatars = list => {
  const avatarList = list.slice(0, NUM_TO_DISPLAY);

  return avatarList.map((participant, i) => {
    if (!participant) {
      return null;
    }
    return <Avatar src={participant.profilePhoto} size={30} radius={15} />;
  });
};

type UserType = {
  profilePhoto: string,
  username: string,
  name: string,
  id: string,
};
type FacepileProps = {
  participants: Array<?UserType>,
  creator: UserType,
};

const Facepile = ({ participants, creator }: FacepileProps) => {
  if (!participants || participants.length === 0) {
    return (
      <FacepileContainer>
        <Avatar src={creator.profilePhoto} size={30} radius={15} />;
      </FacepileContainer>
    );
  }

  const participantList = participants.filter(
    participant => participant && participant.id !== creator.id
  );
  const participantCount = participants.length;

  const hasOverflow = participantCount > NUM_TO_DISPLAY;
  const overflowAmount =
    participantCount - NUM_TO_DISPLAY > 9
      ? '···'
      : `+${participantCount - NUM_TO_DISPLAY}`;

  return (
    <FacepileContainer>
      <Avatar src={creator.profilePhoto} size={30} radius={15} />
      {messageAvatars(participantList)}
      {hasOverflow && (
        <EmptyParticipantHead adjustsFontSizeToFit>
          {overflowAmount}
        </EmptyParticipantHead>
      )}
    </FacepileContainer>
  );
};

export default Facepile;
