// @flow
import React from 'react';
import { createStackNavigator } from 'react-navigation';
import { Button } from 'react-native';
import { withMappedNavigationProps } from 'react-navigation-props-mapper';
import BaseStack from './BaseStack';
import DirectMessages from '../DirectMessages';
import DirectMessageThread from '../DirectMessageThread';
import DirectMessageComposer from '../DirectMessageComposer';
import type { NavigationScreenConfigProps } from 'react-navigation';

const DMStack = createStackNavigator(
  {
    DirectMessages: {
      screen: withMappedNavigationProps(DirectMessages),
      navigationOptions: ({ navigation }) => ({
        headerTitle: navigation.getParam('title', 'Messages'),
        headerRight: (
          <Button
            onPress={() => navigation.navigate('DirectMessageComposer')}
            title="New"
          />
        ),
      }),
    },
    DirectMessageThread: {
      screen: withMappedNavigationProps(DirectMessageThread),
      navigationOptions: ({ navigation }) => ({
        headerTitle: navigation.getParam('title', null),
        tabBarVisible: false,
      }),
    },
    ...BaseStack,
  },
  {
    initialRouteName: 'DirectMessages',
  }
);

const ModalStack = createStackNavigator(
  {
    DirectMessages: {
      screen: withMappedNavigationProps(DMStack),
      // We don't want to show two headers, so we hide the header of the second stack
      navigationOptions: {
        header: null,
      },
    },
    DirectMessageComposer: {
      screen: withMappedNavigationProps(DirectMessageComposer),
      navigationOptions: ({ navigation }: NavigationScreenConfigProps) => ({
        headerTitle: navigation.getParam('title', 'New Direct Message'),
        // TODO(@mxstbr): Replace with X icon
        headerLeft: ({ onPress }) => <Button onPress={onPress} title="X" />,
      }),
    },
  },
  {
    mode: 'modal',
    initialRouteName: 'DirectMessages',
  }
);

export default ModalStack;
