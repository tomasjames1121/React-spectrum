// @flow
import * as React from 'react';
import Link from 'src/components/link';
import {
  StyledThreadListItem,
  ThreadListItemTitle,
  ThreadListItemSubtitle,
} from '../style';

type ThreadProps = {
  id: string,
  author: {
    user: {
      name: string,
      username: string,
    },
  },
  content: {
    title: string,
  },
  createdAt: Date,
  messageCount: number,
};

type Props = {
  thread: ThreadProps,
};

class ThreadListItem extends React.Component<Props> {
  render() {
    const {
      thread: {
        id,
        author: { user: { name, username } },
        content: { title },
        messageCount,
      },
    } = this.props;

    return (
      <StyledThreadListItem>
        <Link
          to={{
            pathname: window.location.pathname,
            search: `?thread=${id}`,
          }}
        >
          <ThreadListItemTitle>{title}</ThreadListItemTitle>
        </Link>
        {messageCount > 0 && (
          <ThreadListItemSubtitle>
            {messageCount > 1 ? `${messageCount} messages` : '1 message'}
          </ThreadListItemSubtitle>
        )}
        <ThreadListItemSubtitle>
          By <Link to={`/users/${username}`}>{name}</Link>
        </ThreadListItemSubtitle>
      </StyledThreadListItem>
    );
  }
}

export default ThreadListItem;
