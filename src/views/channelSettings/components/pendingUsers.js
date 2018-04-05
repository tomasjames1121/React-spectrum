//@flow
import * as React from 'react';
import compose from 'recompose/compose';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { MessageIconContainer, UserListItemContainer } from '../style';
import GranularUserProfile from 'src/components/granularUserProfile';
import { TextButton } from 'src/components/buttons';
import { Loading } from 'src/components/loading';
import viewNetworkHandler from 'src/components/viewNetworkHandler';
import getPendingUsersQuery from 'shared/graphql/queries/channel/getChannelPendingUsers';
import type { GetChannelPendingUsersType } from 'shared/graphql/queries/channel/getChannelPendingUsers';
import ViewError from 'src/components/viewError';
import { initNewThreadWithUser } from 'src/actions/directMessageThreads';
import { ListContainer, Description } from 'src/components/listItems/style';
import { SectionCard, SectionTitle } from 'src/components/settingsViews/style';
import Icon from 'src/components/icons';

type Props = {
  data: {
    channel: GetChannelPendingUsersType,
  },
  togglePending: Function,
  isLoading: boolean,
  dispatch: Function,
  history: Object,
  currentUser: ?Object,
};

class PendingUsers extends React.Component<Props> {
  initMessage = user => {
    this.props.dispatch(initNewThreadWithUser(user));
    return this.props.history.push('/messages/new');
  };

  render() {
    const { data, isLoading, togglePending, currentUser } = this.props;

    if (data && data.channel) {
      const { pendingUsers } = data.channel;

      return (
        <SectionCard>
          <SectionTitle>Pending Members</SectionTitle>
          {pendingUsers.length > 0 && (
            <Description>
              Approving requests will allow a person to view all threads and
              messages in this channel, as well as allow them to post their own
              threads.
            </Description>
          )}

          <ListContainer>
            {pendingUsers &&
              pendingUsers.map(user => {
                if (!user) return null;
                return (
                  <UserListItemContainer key={user.id}>
                    <GranularUserProfile
                      userObject={user}
                      id={user.id}
                      name={user.name}
                      username={user.username}
                      isCurrentUser={currentUser && user.id === currentUser.id}
                      isOnline={user.isOnline}
                      onlineSize={'small'}
                      profilePhoto={user.profilePhoto}
                      avatarSize={'32'}
                      description={user.description}
                    >
                      <div style={{ display: 'flex' }}>
                        <TextButton
                          onClick={() =>
                            user && togglePending(user.id, 'block')
                          }
                          hoverColor={'warn.alt'}
                          icon="minus"
                        >
                          Block
                        </TextButton>

                        <TextButton
                          onClick={() =>
                            user && togglePending(user.id, 'approve')
                          }
                          hoverColor={'brand.default'}
                          icon="plus"
                        >
                          Approve
                        </TextButton>

                        {currentUser &&
                          user.id !== currentUser.id && (
                            <MessageIconContainer>
                              <Icon
                                glyph={'message'}
                                onClick={() => this.initMessage(user)}
                              />
                            </MessageIconContainer>
                          )}
                      </div>
                    </GranularUserProfile>
                  </UserListItemContainer>
                );
              })}

            {pendingUsers.length <= 0 && (
              <Description>
                There are no pending requests to join this channel.
              </Description>
            )}
          </ListContainer>
        </SectionCard>
      );
    }

    if (isLoading) {
      return (
        <SectionCard>
          <Loading />
        </SectionCard>
      );
    }

    return (
      <SectionCard>
        <ViewError />
      </SectionCard>
    );
  }
}

const map = state => ({ currentUser: state.users.currentUser });

export default compose(
  // $FlowIssue
  connect(map),
  withRouter,
  getPendingUsersQuery,
  viewNetworkHandler
)(PendingUsers);
