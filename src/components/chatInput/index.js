// @flow
import * as React from 'react';
import compose from 'recompose/compose';
import { connect } from 'react-redux';
import { Mention } from 'react-mentions';
import { withApollo } from 'react-apollo';
import Icon from 'src/components/icons';
import { FlexRow } from 'src/components/globals';
import { addToastWithTimeout } from 'src/actions/toasts';
import { openModal } from 'src/actions/modals';
import { replyToMessage } from 'src/actions/message';
import { withCurrentUser } from 'src/components/withCurrentUser';
import { UserAvatar } from 'src/components/avatar';
import {
  Form,
  ChatInputContainer,
  ChatInputWrapper,
  Input,
  InputWrapper,
  SendButton,
  PhotoSizeError,
  MarkdownHint,
  Preformatted,
  PreviewWrapper,
  RemovePreviewButton,
  StyledMentionSuggestion,
  SuggestionsWrapper,
  MentionUsername,
  MentionContent,
  MentionName,
} from './style';
import sendMessage from 'shared/graphql/mutations/message/sendMessage';
import sendDirectMessage from 'shared/graphql/mutations/message/sendDirectMessage';
import { searchUsersQuery } from 'shared/graphql/queries/search/searchUsers';
import { getMessageById } from 'shared/graphql/queries/message/getMessage';
import MediaUploader from './components/mediaUploader';
import { QuotedMessage as QuotedMessageComponent } from '../message/view';
import type { Dispatch } from 'redux';
import { ESC, BACKSPACE, DELETE } from 'src/helpers/keycodes';

const MentionSuggestion = ({ entry, search, focused }) => (
  <StyledMentionSuggestion focused={focused}>
    <UserAvatar size={32} user={entry} />
    <MentionContent>
      <MentionName focused={focused}>{entry.name}</MentionName>
      <MentionUsername focused={focused}>@{entry.username}</MentionUsername>
    </MentionContent>
  </StyledMentionSuggestion>
);

const QuotedMessage = connect()(
  getMessageById(props => {
    if (props.data && props.data.message) {
      return <QuotedMessageComponent message={props.data.message} />;
    }

    // if the query is done loading and no message was returned, clear the input
    if (props.data && props.data.networkStatus === 7 && !props.data.message) {
      props.dispatch(
        addToastWithTimeout(
          'error',
          'The message you are replying to was deleted or could not be fetched.'
        )
      );
      props.dispatch(
        replyToMessage({ threadId: props.threadId, messageId: null })
      );
    }

    return null;
  })
);

type Props = {
  onRef: Function,
  currentUser: Object,
  dispatch: Dispatch<Object>,
  createThread: Function,
  sendMessage: Function,
  sendDirectMessage: Function,
  forceScrollToBottom: Function,
  threadType: string,
  thread: string,
  clear: Function,
  websocketConnection: string,
  networkOnline: boolean,
  threadData?: Object,
  refetchThread?: Function,
  quotedMessage: ?{ messageId: string, threadId: string },
  // used to pre-populate the @mention suggestions with participants and the author of the thread
  participants: Array<?Object>,
  onFocus: ?Function,
  onBlur: ?Function,
};

export const cleanSuggestionUserObject = user => {
  return {
    ...user,
    id: user.username,
    display: user.username,
    filterName: user.name.toLowerCase(),
  };
};

// $FlowFixMe
const ChatInput = (props: Props) => {
  const cacheKey = `last-content-${props.thread}`;
  // $FlowFixMe
  const [text, changeText] = React.useState('');
  // $FlowFixMe
  const [photoSizeError, setPhotoSizeError] = React.useState('');
  // $FlowFixMe
  const [inputRef, setInputRef] = React.useState(null);

  // On mount, set the text state to the cached value if one exists
  // $FlowFixMe
  React.useEffect(
    () => {
      changeText(localStorage.getItem(cacheKey) || '');
      // NOTE(@mxstbr): We ONLY want to run this if we switch between threads, never else!
    },
    [props.thread]
  );

  // Cache the latest text everytime it changes
  // $FlowFixMe
  React.useEffect(
    () => {
      localStorage.setItem(cacheKey, text);
    },
    [text]
  );

  // Focus chatInput when quoted message changes
  // $FlowFixMe
  React.useEffect(
    () => {
      if (inputRef) inputRef.focus();
    },
    [props.quotedMessage && props.quotedMessage.messageId]
  );

  const removeAttachments = () => {
    removeQuotedMessage();
    setMediaPreview(null);
  };

  const handleKeyPress = e => {
    // We shouldn't do anything during composition of IME.
    // `keyCode === 229` is a fallback for old browsers like IE.
    if (e.isComposing || e.keyCode === 229) {
      return;
    }
    switch (e.key) {
      // Submit on Enter unless Shift is pressed
      case 'Enter': {
        if (e.shiftKey) return;
        e.preventDefault();
        submit();
        return;
      }
      // If backspace is pressed on the empty
      case 'Backspace': {
        if (text.length === 0) removeAttachments();
        return;
      }
    }
  };

  const onChange = e => {
    const text = e.target.value;
    changeText(text);
  };

  const sendMessage = ({ file, body }: { file?: any, body?: string }) => {
    // user is creating a new directMessageThread, break the chain
    // and initiate a new group creation with the message being sent
    // in views/directMessages/containers/newThread.js
    if (props.thread === 'newDirectMessageThread') {
      return props.createThread({
        messageType: file ? 'media' : 'text',
        file,
        messageBody: body,
      });
    }

    const method =
      props.threadType === 'story'
        ? props.sendMessage
        : props.sendDirectMessage;
    return method({
      threadId: props.thread,
      messageType: file ? 'media' : 'text',
      threadType: props.threadType,
      parentId: props.quotedMessage,
      content: {
        body,
      },
      file,
    });
  };

  const submit = async e => {
    if (e) e.preventDefault();

    if (!props.networkOnline) {
      return props.dispatch(
        addToastWithTimeout(
          'error',
          'Not connected to the internet - check your internet connection or try again'
        )
      );
    }

    if (
      props.websocketConnection !== 'connected' &&
      props.websocketConnection !== 'reconnected'
    ) {
      return props.dispatch(
        addToastWithTimeout(
          'error',
          'Error connecting to the server - hang tight while we try to reconnect'
        )
      );
    }

    if (!props.currentUser) {
      // user is trying to send a message without being signed in
      return props.dispatch(openModal('CHAT_INPUT_LOGIN_MODAL', {}));
    }

    // If a user sends a message, force a scroll to bottom. This doesn't exist if this is a new DM thread
    if (props.forceScrollToBottom) props.forceScrollToBottom();

    if (mediaFile) {
      setIsSendingMediaMessage(true);
      if (props.forceScrollToBottom) props.forceScrollToBottom();
      await sendMessage({
        file: mediaFile,
        body: '{"blocks":[],"entityMap":{}}',
      })
        .then(() => {
          setIsSendingMediaMessage(false);
          setMediaPreview(null);
          setAttachedMediaFile(null);
        })
        .catch(err => {
          setIsSendingMediaMessage(false);
          props.dispatch(addToastWithTimeout('error', err.message));
        });
    }

    if (text.length === 0) return;

    sendMessage({ body: text })
      .then(() => {
        // If we're viewing a thread and the user sends a message as a non-member, we need to refetch the thread data
        if (
          props.threadType === 'story' &&
          props.threadData &&
          !props.threadData.channel.channelPermissions.isMember &&
          props.refetchThread
        ) {
          return props.refetchThread();
        }
      })
      .catch(err => {
        props.dispatch(addToastWithTimeout('error', err.message));
      });

    // Clear the chat input now that we're sending a message for sure
    onChange({ target: { value: '' } });
    removeQuotedMessage();
  };

  // $FlowFixMe
  const [isSendingMediaMessage, setIsSendingMediaMessage] = React.useState(
    false
  );
  // $FlowFixMe
  const [mediaPreview, setMediaPreview] = React.useState(null);
  // $FlowFixMe
  const [mediaFile, setAttachedMediaFile] = React.useState(null);

  const previewMedia = blob => {
    if (isSendingMediaMessage) return;
    setIsSendingMediaMessage(true);
    setAttachedMediaFile(blob);
    inputRef && inputRef.focus();

    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result.toString());
      setIsSendingMediaMessage(false);
    };

    if (blob) {
      reader.readAsDataURL(blob);
    }
  };

  const removeQuotedMessage = () => {
    if (props.quotedMessage)
      props.dispatch(
        replyToMessage({ threadId: props.thread, messageId: null })
      );
  };

  const sortSuggestions = (a, b, queryString) => {
    const aUsernameIndex = a.username.indexOf(queryString || '');
    const bUsernameIndex = b.username.indexOf(queryString || '');
    const aNameIndex = a.filterName.indexOf(queryString || '');
    const bNameIndex = b.filterName.indexOf(queryString || '');
    if (aNameIndex === 0) return -1;
    if (aUsernameIndex === 0) return -1;
    if (aNameIndex === 0) return -1;
    if (aUsernameIndex === 0) return -1;
    return aNameIndex - bNameIndex || aUsernameIndex - bUsernameIndex;
  };

  const searchUsers = async (queryString, callback) => {
    const filteredParticipants = props.participants
      ? props.participants
          .map(cleanSuggestionUserObject)
          .filter(Boolean)
          .filter(participant => {
            return (
              participant.username &&
              (participant.username.indexOf(queryString || '') > -1 ||
                participant.filterName.indexOf(queryString || '') > -1)
            );
          })
          .sort((a, b) => {
            return sortSuggestions(a, b, queryString);
          })
          .slice(0, 8)
      : [];

    callback(filteredParticipants);

    if (!queryString || queryString.length === 0)
      return callback(filteredParticipants);

    const {
      data: { search },
    } = await props.client.query({
      query: searchUsersQuery,
      variables: {
        queryString,
        type: 'USERS',
      },
    });

    if (!search || !search.searchResultsConnection) {
      if (filteredParticipants && filteredParticipants.length > 0)
        return filteredParticipants;
      return;
    }

    let searchUsers = search.searchResultsConnection.edges
      .filter(Boolean)
      .filter(edge => edge.node.username)
      .map(edge => {
        const user = edge.node;
        return cleanSuggestionUserObject(user);
      });

    // Prepend the filtered participants in case a user is tabbing down right now
    const fullResults = [...filteredParticipants, ...searchUsers];
    const uniqueResults = [];
    const done = [];

    fullResults.forEach(item => {
      if (done.indexOf(item.username) === -1) {
        uniqueResults.push(item);
        done.push(item.username);
      }
    });

    return callback(uniqueResults.slice(0, 8));
  };

  const networkDisabled =
    !props.networkOnline ||
    (props.websocketConnection !== 'connected' &&
      props.websocketConnection !== 'reconnected');
  return (
    <React.Fragment>
      <ChatInputContainer>
        {photoSizeError && (
          <PhotoSizeError>
            <p>{photoSizeError}</p>
            <Icon
              onClick={() => setPhotoSizeError('')}
              glyph="view-close"
              size={16}
              color={'warn.default'}
            />
          </PhotoSizeError>
        )}
        <ChatInputWrapper>
          {props.currentUser && (
            <MediaUploader
              isSendingMediaMessage={isSendingMediaMessage}
              currentUser={props.currentUser}
              onValidated={previewMedia}
              onError={err => setPhotoSizeError(err)}
            />
          )}
          <Form onSubmit={submit}>
            <InputWrapper
              hasAttachment={!!props.quotedMessage || !!mediaPreview}
              networkDisabled={networkDisabled}
            >
              {mediaPreview && (
                <PreviewWrapper>
                  <img src={mediaPreview} alt="" />
                  <RemovePreviewButton onClick={() => setMediaPreview(null)}>
                    <Icon glyph="view-close-small" size={'16'} />
                  </RemovePreviewButton>
                </PreviewWrapper>
              )}
              {props.quotedMessage && (
                <PreviewWrapper data-cy="staged-quoted-message">
                  <QuotedMessage
                    id={props.quotedMessage}
                    threadId={props.thread}
                  />
                  <RemovePreviewButton
                    data-cy="remove-staged-quoted-message"
                    onClick={removeQuotedMessage}
                  >
                    <Icon glyph="view-close-small" size={'16'} />
                  </RemovePreviewButton>
                </PreviewWrapper>
              )}
              <Input
                hasAttachment={!!props.quotedMessage || !!mediaPreview}
                networkDisabled={networkDisabled}
                placeholder="Your message here..."
                value={text}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
                onChange={onChange}
                onKeyDown={handleKeyPress}
                inputRef={node => {
                  if (props.onRef) props.onRef(node);
                  setInputRef(node);
                }}
              >
                <Mention
                  trigger="@"
                  data={searchUsers}
                  appendSpaceOnAdd={true}
                  renderSuggestion={(
                    entry,
                    search,
                    highlightedDisplay,
                    index,
                    focused
                  ) => (
                    <MentionSuggestion
                      entry={entry}
                      highlightedDisplay={highlightedDisplay}
                      focused={focused}
                      search={search}
                      index={index}
                    />
                  )}
                />
              </Input>
            </InputWrapper>
            <SendButton
              data-cy="chat-input-send-button"
              glyph="send-fill"
              onClick={submit}
              // hasAttachment={mediaPreview || quotedMessage ? true : false}
            />
          </Form>
        </ChatInputWrapper>
      </ChatInputContainer>
      <MarkdownHint showHint={text.length > 0} data-cy="markdownHint">
        <b>**bold**</b>
        <i>*italic*</i>
        <Preformatted>`code`</Preformatted>
        <Preformatted>```codeblock```</Preformatted>
        <Preformatted>[name](link)</Preformatted>
      </MarkdownHint>
    </React.Fragment>
  );
};

const map = (state, ownProps) => ({
  websocketConnection: state.connectionStatus.websocketConnection,
  networkOnline: state.connectionStatus.networkOnline,
  quotedMessage: state.message.quotedMessage[ownProps.thread] || null,
});

export default compose(
  withCurrentUser,
  withApollo,
  sendMessage,
  sendDirectMessage,
  // $FlowIssue
  connect(map)
)(ChatInput);
