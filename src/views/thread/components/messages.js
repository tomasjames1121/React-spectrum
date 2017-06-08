// @flow
import React, { Component } from 'react';
// $FlowFixMe
import compose from 'recompose/compose';
import { sortAndGroupMessages } from '../../../helpers/messages';
import ChatMessages from '../../../components/chatMessages';
import Icon from '../../../components/icons';
import { HorizontalRule } from '../../../components/globals';
import { displayLoadingCard } from '../../../components/loading';
import { ChatWrapper } from '../style';
import { getThreadMessages } from '../queries';
import { toggleReactionMutation } from '../mutations';

class MessagesWithData extends Component {
  state: {
    subscription: ?Object,
  };

  state = {
    subscription: null,
  };

  componentDidUpdate(prevProps) {
    // force scroll to bottom when a message is sent in the same thread
    if (
      prevProps.data.thread.messageConnection !==
      this.props.data.thread.messageConnection
    ) {
      this.props.contextualScrollToBottom();
    }
  }

  componentDidMount() {
    const { currentUser, participants } = this.props;
    const isParticipant = participants.some(user => user === currentUser.id);
    if (isParticipant) {
      this.props.forceScrollToBottom();
    }
    this.subscribe();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  subscribe = () => {
    console.log('SUBSCRIBE');
    this.setState({
      subscription: this.props.subscribeToNewMessages(),
    });
  };

  unsubscribe = () => {
    const { subscription } = this.state;
    if (subscription) {
      console.log('UNSUBSCRIBE');
      // This unsubscribes the subscription
      subscription();
    }
  };

  render() {
    const { data, toggleReaction, forceScrollToBottom } = this.props;

    if (data.error) {
      return <div>Error!</div>;
    }

    if (!data.thread && !data.thread.messageConnection) {
      return <div>No messages yet!</div>;
    }

    const sortedMessages = sortAndGroupMessages(
      data.thread.messageConnection.edges
    );

    return (
      <ChatWrapper>
        <HorizontalRule>
          <hr />
          <Icon glyph={'message'} />
          <hr />
        </HorizontalRule>
        <ChatMessages
          threadId={data.thread.id}
          toggleReaction={toggleReaction}
          messages={sortedMessages}
          threadType={'story'}
          forceScrollToBottom={forceScrollToBottom}
        />
      </ChatWrapper>
    );
  }
}

const Messages = compose(
  toggleReactionMutation,
  getThreadMessages,
  displayLoadingCard
)(MessagesWithData);

export default Messages;
