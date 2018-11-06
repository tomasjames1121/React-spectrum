// @flow
import * as React from 'react';
import compose from 'recompose/compose';
import Textarea from 'react-textarea-autosize';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { closeComposer } from '../../../actions/composer';
import { changeActiveThread } from '../../../actions/dashboardFeed';
import { addToastWithTimeout } from '../../../actions/toasts';
import Editor from '../../rich-text-editor';
import {
  toPlainText,
  fromPlainText,
  toJSON,
  toState,
  isAndroid,
} from 'shared/draft-utils';
import getComposerCommunitiesAndChannels from 'shared/graphql/queries/composer/getComposerCommunitiesAndChannels';
import type { GetComposerType } from 'shared/graphql/queries/composer/getComposerCommunitiesAndChannels';
import publishThread from 'shared/graphql/mutations/thread/publishThread';
import { TextButton, Button } from '../../buttons';
import { FlexRow } from '../../../components/globals';
import { LoadingComposer } from '../../loading';
import viewNetworkHandler from '../../viewNetworkHandler';
import {
  Container,
  Composer,
  Overlay,
  ThreadDescription,
  ThreadTitle,
  ContentContainer,
  Actions,
  Dropdowns,
  DisconnectedWarning,
} from '../style';
import { events, track } from 'src/helpers/analytics';
import type { Dispatch } from 'redux';

type Props = {
  isOpen: boolean,
  dispatch: Dispatch<Object>,
  isLoading: boolean,
  activeChannel?: string,
  activeCommunity?: string,
  isInbox: boolean,
  mutate: Function,
  history: Object,
  publishThread: Function,
  data: {
    refetch: Function,
    user: GetComposerType,
  },
  networkOnline: boolean,
  websocketConnection: string,
};

type State = {
  isMounted: boolean,
  title: string,
  body: Object,
  availableCommunities: Array<any>,
  availableChannels: Array<any>,
  activeCommunity: ?string,
  activeChannel: ?string,
  isPublishing: boolean,
  postWasPublished: boolean,
};

const LS_BODY_KEY = 'last-thread-composer-body';
const LS_TITLE_KEY = 'last-thread-composer-title';
const LS_COMPOSER_EXPIRE = 'last-thread-composer-expire';

const ONE_DAY = (new Date().getTime() + 60 * 60 * 24 * 1000).toString();

class ThreadComposerWithData extends React.Component<Props, State> {
  bodyEditor: any;
  titleTextarea: any;

  constructor(props) {
    super(props);

    const { storedBody, storedTitle } = this.getStoredContent();

    this.state = {
      isMounted: true,
      title: storedTitle || '',
      body: storedBody || fromPlainText(''),
      availableCommunities: [],
      availableChannels: [],
      activeCommunity: '',
      activeChannel: '',
      isPublishing: false,
      postWasPublished: false,
    };
  }

  removeStorage = () => {
    localStorage.removeItem(LS_BODY_KEY);
    localStorage.removeItem(LS_TITLE_KEY);
    localStorage.removeItem(LS_COMPOSER_EXPIRE);
  };

  getStoredContent = () => {
    // We persist the body and title to localStorage
    // so in case the app crashes users don't loose content
    let storedBody, storedTitle;

    if (this.hasLocalStorage()) {
      try {
        const expireTime = localStorage.getItem(LS_COMPOSER_EXPIRE);
        const currTime = new Date().getTime();
        /////if current time is greater than valid till of text then please expire title/body back to ''
        if (currTime > parseInt(expireTime, 10)) {
          this.removeStorage();
          return { storedBody, storedTitle };
        } else {
          storedBody = toState(
            JSON.parse(localStorage.getItem(LS_BODY_KEY) || '')
          );
          storedTitle = localStorage.getItem(LS_TITLE_KEY);
          return { storedBody, storedTitle };
        }
      } catch (err) {
        this.removeStorage();
        return { storedBody, storedTitle };
      }
    }

    return { storedBody, storedTitle };
  };

  hasLocalStorage = () => !!localStorage;

  persistTitle = title => {
    if (this.hasLocalStorage()) {
      localStorage.setItem(LS_TITLE_KEY, title);
      localStorage.setItem(LS_COMPOSER_EXPIRE, ONE_DAY);
    }
  };

  persistBody = body => {
    if (this.hasLocalStorage()) {
      localStorage.setItem(LS_BODY_KEY, JSON.stringify(toJSON(body)));
      localStorage.setItem(LS_COMPOSER_EXPIRE, ONE_DAY);
    }
  };

  handleIncomingProps = props => {
    const { isMounted } = this.state;
    if (!isMounted) return;
    /*
      Create a new array of communities only containing the `node` data from
      graphQL. Then filter the resulting channel to remove any communities
      that don't have any channels yet
    */

    // if the user doesn't exist, bust outta here
    if (!props.data.user || props.data.user === undefined) return;

    const availableCommunities = props.data.user.communityConnection.edges
      .map(edge => edge && edge.node)
      .filter(
        community =>
          community &&
          (community.communityPermissions.isMember ||
            community.communityPermissions.isOwner)
      )
      .sort((a, b) => {
        const bc = b && parseInt(b.communityPermissions.reputation, 10);
        const ac = a && parseInt(a.communityPermissions.reputation, 10);
        return bc && ac && bc <= ac ? -1 : 1;
      });

    /*
      Iterate through each of our community nodes to construct a new array
      of possible channels

      returns an array of array, where each parent array represents a community
      and each child array represents the channels within that parent
      community
    */
    const availableChannels = props.data.user.channelConnection.edges
      .map(edge => edge && edge.node)
      .filter(
        channel =>
          channel &&
          (channel.channelPermissions.isMember ||
            channel.channelPermissions.isOwner)
      )
      .filter(channel => {
        if (!channel) return null;
        if (!channel.isPrivate) return channel;
        if (channel.isArchived) return null;
        return channel;
      })
      .filter(channel => {
        if (!channel) return null;
        return !channel.isArchived;
      });

    /*
      If a user is viewing a communit or channel, we use the url as a prop
      to set a default activeCommunity and activeChannel

      If no defaults are set, we use the first available community, and then
      find the first available channel within that available community
    */
    const activeCommunityFromPropsOrState =
      props.activeCommunity || this.state.activeCommunity;

    let activeCommunity =
      availableCommunities &&
      (activeCommunityFromPropsOrState
        ? availableCommunities.filter(community => {
            if (!community) return null;
            return (
              community.slug.toLowerCase() ===
              activeCommunityFromPropsOrState.toLowerCase()
            );
          })
        : availableCommunities);

    activeCommunity =
      activeCommunity && activeCommunity.length > 0 && !!activeCommunity[0]
        ? activeCommunity[0].id
        : null;

    if (!activeCommunity) {
      return props.data.refetch();
    } else {
      this.setActiveStuff(
        availableCommunities,
        availableChannels,
        activeCommunity
      );
    }
  };

  // prettier-ignore
  setActiveStuff = (availableCommunities, availableChannels, activeCommunity) => {
    const props = this.props;
    const { isMounted } = this.state;
    if (!isMounted) return;
    // get the channels for the proper community
    const activeCommunityChannels = availableChannels.filter(
      channel => channel && channel.community.id === activeCommunity
    );
    let activeChannel = [];

    // Get the active channel if there is one
    if (props.activeChannel) {
      activeChannel = activeCommunityChannels.filter(
        channel =>
          channel &&
          props.activeChannel &&
          // $FlowFixMe
          channel.slug.toLowerCase() === props.activeChannel.toLowerCase()
      );
    } else {
      // Try and get the default channel for the active community
      activeChannel = activeCommunityChannels.filter(
        channel => channel && channel.isDefault
      );
      // If there is no default channel capitulate and take the first one
      if (activeChannel.length === 0) {
        activeChannel = activeCommunityChannels;
      } else if (activeChannel.length > 1) {
        const generalChannel = activeChannel.filter(
          channel => channel && channel.slug === 'general'
        );
        if (generalChannel.length > 0) activeChannel = generalChannel;
      }
    }

    // ensure that if no items were found for some reason, we don't crash the app
    // and instead just set null values on the composer
    activeChannel = (activeChannel.length > 0 && !!activeChannel[0]) ? activeChannel[0].id : null;

    const { storedTitle, storedBody } = this.getStoredContent()

    this.setState({
      title: storedTitle || '',
      body: storedBody || fromPlainText(''),
      availableCommunities,
      availableChannels,
      activeCommunity,
      activeChannel,
      isPublishing: false,
    });
  };

  componentDidMount() {
    track(events.THREAD_CREATED_INITED);
    this.setState({ isMounted: true });
    this.props.data
      .refetch()
      .then(result => {
        // we have to rebuild a new props object to pass to `this.handleIncomingProps`
        // in order to retain all the previous props passed in from the parent
        // component and the initial data functions provided by apollo
        const newProps = Object.assign({}, this.props, {
          ...this.props,
          data: {
            ...this.props.data,
            user: {
              ...this.props.data.user,
              ...result.data.user,
            },
          },
        });
        return this.handleIncomingProps(newProps);
      })
      .catch(err =>
        this.props.dispatch(addToastWithTimeout('error', err.message))
      );

    if (this.titleTextarea && this.titleTextarea.focus)
      this.titleTextarea.focus();
  }

  componentWillUpdate(nextProps) {
    const { isOpen } = nextProps;
    if (isOpen) {
      // $FlowIssue
      document.addEventListener('keydown', this.handleKeyPress, false);
    } else {
      // $FlowIssue
      document.removeEventListener('keydown', this.handleKeyPress, false);
    }
  }

  componentWillUnmount() {
    this.setState({ isMounted: false });
    // $FlowIssue
    document.removeEventListener('keydown', this.handleKeyPress, false);
    const { postWasPublished } = this.state;

    // if a post was published, in this session, clear redux so that the next
    // composer open will start fresh
    if (postWasPublished) return this.closeComposer();

    // otherwise, clear the composer normally and save the state
    return this.closeComposer();
  }

  handleKeyPress = e => {
    // if person taps esc, close the dialog
    if (e.keyCode === 27) {
      this.closeComposer();
    }
  };

  changeTitle = e => {
    const title = e.target.value;
    if (/\n$/g.test(title)) {
      this.bodyEditor && this.bodyEditor.focus && this.bodyEditor.focus();
      return;
    }

    this.persistTitle(title);
    this.setState({ title });
  };

  changeBody = body => {
    this.persistBody(body);
    this.setState({ body });
  };

  componentDidUpdate(prevProps) {
    const curr = this.props;
    const { isMounted } = this.state;
    if (!isMounted) return;
    if (prevProps.isLoading && !curr.isLoading)
      return this.handleIncomingProps(this.props);

    const { availableCommunities, availableChannels } = this.state;
    let activeCommunity;

    if (prevProps.activeCommunity !== this.props.activeCommunity) {
      activeCommunity = this.props.activeCommunity
        ? availableCommunities.filter(community => {
            return community.slug === this.props.activeCommunity;
          })[0].id
        : availableCommunities[0].id;

      this.setState({
        activeCommunity,
      });
    }

    if (prevProps.activeChannel !== this.props.activeChannel) {
      const activeCommunityChannels = availableChannels.filter(
        channel => channel.community.id === activeCommunity
      );
      let activeChannel = [];

      // Get the active channel if there is one
      if (this.props.activeChannel) {
        activeChannel = activeCommunityChannels.filter(
          channel => channel.slug === this.props.activeChannel
        );
      } else {
        // Try and get the default channel for the active community
        activeChannel = activeCommunityChannels.filter(
          channel => channel.isDefault
        );
        // If there is no default channel capitulate and take the first one
        if (activeChannel.length === 0) {
          activeChannel = activeCommunityChannels;
          // If there are more than one default ones, try and choose the "General" one if it exists
        } else if (activeChannel.length > 1) {
          const generalChannel = activeChannel.filter(
            channel => channel.slug === 'general'
          );
          if (generalChannel.length > 0) activeChannel = generalChannel;
        }
      }

      // ensure that if no items were found for some reason, we don't crash the app
      // and instead just set null values on the composer
      activeChannel = activeChannel.length > 0 ? activeChannel[0].id : null;

      this.setState({
        activeChannel,
      });
    }
  }

  closeComposer = (clear?: string) => {
    // we will clear the composer if it unmounts as a result of a post
    // being published, that way the next composer open will start fresh
    if (clear) return this.props.dispatch(closeComposer());

    // otherwise, we will save the editor state to rehydrate the title and
    // body if the user reopens the composer in the same session
    this.props.dispatch(closeComposer());
  };

  setActiveCommunity = e => {
    const newActiveCommunity = e.target.value;
    const activeCommunityChannels = this.state.availableChannels.filter(
      channel => channel && channel.community.id === newActiveCommunity
    );
    const newActiveCommunityData = this.state.availableCommunities.find(
      community => community && community.id === newActiveCommunity
    );
    const newActiveChannel =
      activeCommunityChannels.find(channel => {
        if (!channel) return null;
        // If there is an active channel and we're switching back to the currently open community
        // select that channel
        if (
          this.props.activeChannel &&
          newActiveCommunityData &&
          this.props.activeCommunity === newActiveCommunityData.slug
        ) {
          return channel.slug === this.props.activeChannel;
        }
        // Otherwise select the default one
        return channel.isDefault;
        // Default to the first channel if no default one can be found
      }) || activeCommunityChannels[0];

    this.setState({
      activeCommunity: newActiveCommunity,
      activeChannel: newActiveChannel.id,
    });
  };

  setActiveChannel = e => {
    const activeChannel = e.target.value;

    this.setState({
      activeChannel,
    });
  };

  publishThread = () => {
    // if no title and no channel is set, don't allow a thread to be published
    if (!this.state.title || !this.state.activeChannel) {
      return;
    }

    // isPublishing will change the publish button to a loading spinner
    this.setState({
      isPublishing: true,
    });

    const { dispatch, networkOnline, websocketConnection } = this.props;

    if (!networkOnline) {
      return dispatch(
        addToastWithTimeout(
          'error',
          'Not connected to the internet - check your internet connection or try again'
        )
      );
    }

    if (
      websocketConnection !== 'connected' &&
      websocketConnection !== 'reconnected'
    ) {
      return dispatch(
        addToastWithTimeout(
          'error',
          'Error connecting to the server - hang tight while we try to reconnect'
        )
      );
    }

    // define new constants in order to construct the proper shape of the
    // input for the publishThread mutation
    const { activeChannel, activeCommunity, title, body } = this.state;
    const channelId = activeChannel;
    const communityId = activeCommunity;
    const jsonBody = toJSON(body);

    const content = {
      title,
      // NOTE(@mxstbr): On Android we send the text as plain text and parse the raw
      // markdown on the server
      body: isAndroid() ? toPlainText(body) : JSON.stringify(jsonBody),
    };

    // Get the images
    const filesToUpload = Object.keys(jsonBody.entityMap)
      .filter(
        key =>
          jsonBody.entityMap[key].type.toLowerCase() === 'image' &&
          jsonBody.entityMap[key].data.file &&
          jsonBody.entityMap[key].data.file.constructor === File
      )
      .map(key => jsonBody.entityMap[key].data.file);

    // this.props.mutate comes from a higher order component defined at the
    // bottom of this file
    const thread = {
      channelId,
      communityId,
      type: isAndroid() ? 'TEXT' : 'DRAFTJS',
      content,
      filesToUpload,
    };

    this.props
      .publishThread(thread)
      // after the mutation occurs, it will either return an error or the new
      // thread that was published
      .then(({ data }) => {
        // get the thread id to redirect the user
        const id = data.publishThread.id;

        this.removeStorage();

        // stop the loading spinner on the publish button
        this.setState({
          postWasPublished: true,
          isPublishing: false,
        });

        // redirect the user to the thread
        // if they are in the inbox, select it
        this.props.isInbox
          ? this.props.dispatch(changeActiveThread(id))
          : this.props.history.push(`?thread=${id}`);

        this.props.dispatch(
          addToastWithTimeout('success', 'Thread published!')
        );

        this.props.dispatch(closeComposer());

        return;
      })
      .catch(err => {
        this.setState({
          isPublishing: false,
        });
        this.props.dispatch(addToastWithTimeout('error', err.message));
      });
  };

  render() {
    const {
      title,
      availableChannels,
      availableCommunities,
      activeCommunity,
      activeChannel,
      isPublishing,
    } = this.state;

    const {
      isOpen,
      isLoading,
      isInbox,
      networkOnline,
      websocketConnection,
    } = this.props;

    const networkDisabled =
      !networkOnline ||
      (websocketConnection !== 'connected' &&
        websocketConnection !== 'reconnected');

    if (availableCommunities && availableChannels) {
      return (
        <Container isOpen={isOpen} isInbox={isInbox} data-cy="thread-composer">
          <Overlay
            isOpen={isOpen}
            onClick={this.closeComposer}
            isInbox={isInbox}
            data-cy="thread-composer-overlay"
          />
          <Composer isOpen={isOpen} isInbox={isInbox}>
            <ContentContainer isOpen={isOpen}>
              {networkDisabled && (
                <DisconnectedWarning>
                  Lost connection to internet or server...
                </DisconnectedWarning>
              )}

              <Textarea
                onChange={this.changeTitle}
                style={ThreadTitle}
                value={this.state.title}
                placeholder={'What do you want to talk about?'}
                innerRef={ref => (this.titleTextarea = ref)}
                autoFocus
              />

              <Editor
                onChange={this.changeBody}
                state={this.state.body}
                style={ThreadDescription}
                editorRef={editor => (this.bodyEditor = editor)}
                editorKey="thread-composer"
                placeholder="Put your text, photos, code, or embeds here..."
                className={'threadComposer'}
              />

              <Actions>
                <FlexRow>
                  <Dropdowns>
                    <select
                      onChange={this.setActiveCommunity}
                      value={activeCommunity}
                    >
                      {availableCommunities.map(community => {
                        return (
                          <option key={community.id} value={community.id}>
                            {community.name}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      onChange={this.setActiveChannel}
                      value={activeChannel}
                    >
                      {availableChannels
                        .filter(
                          channel => channel.community.id === activeCommunity
                        )
                        .map((channel, i) => {
                          return (
                            <option key={channel.id} value={channel.id}>
                              {channel.name}
                            </option>
                          );
                        })}
                    </select>
                  </Dropdowns>
                </FlexRow>
                <FlexRow>
                  <TextButton
                    hoverColor="warn.alt"
                    onClick={this.closeComposer}
                  >
                    Cancel
                  </TextButton>
                  <Button
                    onClick={this.publishThread}
                    loading={isPublishing}
                    disabled={!title || isPublishing || networkDisabled}
                    color={'brand'}
                  >
                    Publish
                  </Button>
                </FlexRow>
              </Actions>
            </ContentContainer>
          </Composer>
        </Container>
      );
    }

    if (isLoading) {
      return <LoadingComposer />;
    }

    return null;
  }
}

const map = state => ({
  isOpen: state.composer.isOpen,
  websocketConnection: state.connectionStatus.websocketConnection,
  networkOnline: state.connectionStatus.networkOnline,
});
export default compose(
  // $FlowIssue
  connect(map),
  getComposerCommunitiesAndChannels,
  publishThread,
  viewNetworkHandler,
  withRouter
)(ThreadComposerWithData);
