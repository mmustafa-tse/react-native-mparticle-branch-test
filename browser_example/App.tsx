/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  TextInput,
  TouchableHighlight,
  Text,
  StyleSheet,
  View,
  SafeAreaView,
} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import branch, {BranchEvent, BranchParams} from 'react-native-branch';

import WebView from 'react-native-webview';
interface MyState {
  text: string;
  url: string;
  title: string;
  image: string;
  params: BranchParams | undefined;
}

const Stack = createStackNavigator();

class HomeScreen extends React.Component<any, MyState> {
  buo: any;
  _unsubscribeFromBranch: any;

  constructor(props: any) {
    super(props);
    this.state = {
      text: 'https://example.com',
      url: 'https://example.com',
      title: 'Example',
      image: '',
      params: undefined,
    };
  }

  //Read deep link
  componentDidMount() {
    console.log('componentDidMount');

    this._unsubscribeFromBranch = branch.subscribe({
      onOpenStart: ({uri, cachedInitialEvent}) => {
        // cachedInitialEvent is true if the event was received by the
        // native layer before JS loaded.
        console.log(
          'Branch subscribe onOpenStart, will open ' +
            uri +
            ' cachedInitialEvent is ' +
            cachedInitialEvent,
        );
      },
      onOpenComplete: ({error, params, uri}) => {
        if (error) {
          console.error(
            'Branch subscribe onOpenComplete, Error from opening uri: ' +
              uri +
              ' error: ' +
              error,
          );
          return;
        }

        if (params) {
          console.log([params])

          if (!params['+clicked_branch_link']) {
            if (params['+non_branch_link']) {
              this.setState({
                url: params['+non_branch_link'] as string,
                title: params['+non_branch_link'] as string,
              });
            }
            return;
          }

          console.log('Branch opened ' + uri);
          // handle params
          let title = params.$og_title;
          let url = params.$canonical_url as string;
          let image = params.$og_image_url;

          // Now reload the webview
          this.setState({
            text: url,
            url: url,
            title: JSON.stringify(title),
            image: JSON.stringify(image),
            params: params,
          });

          if (params.$deeplink_path === 'main') {
            this.props.navigation.navigate('Main');
          } else if (params.$deeplink_path === 'other') {
            this.props.navigation.navigate('Other');
          }
        }
      },
    });
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    if (this._unsubscribeFromBranch) {
      console.log('Branch unsubscribe');
      this._unsubscribeFromBranch();
      this._unsubscribeFromBranch = null;
    }

    if (this.buo) {
      console.log('Branch buo release');
      this.buo.release();
      this.buo = null;
    }
  }

  render() {

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navbar}>
         <TouchableHighlight
            onPress={() => this.props.navigation.navigate('Main')}
            style={styles.navButton}>
            <Text style={styles.buttonText}>Main</Text>
          </TouchableHighlight>
          <TouchableHighlight
            onPress={() => this.props.navigation.navigate('Other')}
            style={styles.navButton}>
            <Text style={styles.buttonText}>Other</Text>
          </TouchableHighlight>
        </View>
        <View style={styles.container}>
          <View>
            <Text style={styles.titleText}>Referring URL</Text>
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.text}>
              {this.state.params?.['~referring_link'] ?? this.state.url}
            </Text>
          </View>
          <Text style={styles.titleText}>Navigate to URL</Text>
          <TextInput
            style={styles.input}
            onChangeText={text => this.setState({text: text})}
            onEndEditing={this.editingEnded.bind(this)}
            placeholder={'Enter Branch or non-Branch URL'}
            autoCapitalize={'none'}
            autoCorrect={false}
            value={this.state.text}
          />
          <WebView
            style={styles.webView}
            source={{uri: this.state.url}}
            onLoad={this.registerView.bind(this)}
            onNavigationStateChange={this._onNavigationStateChange.bind(this)}
          />
          <TouchableHighlight
            onPress={this.onShare.bind(this)}
            style={styles.button}>
            <Text style={styles.buttonText}>Share</Text>
          </TouchableHighlight>
          <TouchableHighlight
            onPress={() => console.log(this.props)}
            style={styles.button}>
            <Text style={styles.buttonText}>Test</Text>
          </TouchableHighlight>
        </View>
      </SafeAreaView>
    );
  }

  editingEnded() {
    branch.openURL(this.state.text);
  }

  _onNavigationStateChange(webViewState: any) {
    console.log(
      'navigated to url ' + webViewState.url + ' title ' + webViewState.title,
    );
    this.setState({url: webViewState.url, title: webViewState.title});
  }

  async registerView() {
    if (this.buo) {
      this.buo.release();
    }

    if (this.state.url === '') {
      return;
    }

    this.buo = await branch.createBranchUniversalObject('item/12345', {
      canonicalUrl: 'https://www.example.com/other',
      title: 'Example Title'
    });

    let params = {
      transaction_id: 'tras_Id_1232343434',
      currency: 'USD',
      revenue: 180.2,
      shipping: 10.5,
      tax: 13.5,
      coupon: 'promo-1234',
      affiliation: 'high_fi',
      description: 'Preferred purchase',
      purchase_loc: 'Palo Alto',
      store_pickup: 'unavailable',
      custom_data: {
        Custom_Event_Property_Key1: 'Custom_Event_Property_val1',
        Custom_Event_Property_Key2: 'Custom_Event_Property_val2',
      },
    };

    let event = new BranchEvent(BranchEvent.ViewItem, [this.buo], params);
    event.logEvent();

    console.log(
      'Created Branch Universal Object and logged standard view item event.',
    );
  }

  async onShare() {
    let shareOptions = {
      messageHeader: this.state.title,
      messageBody: this.state.title,
    };

    let linkProperties = {
      feature: 'share',
      channel: 'RNApp',
    };

    let controlParams = {
      $desktop_url: 'http://example.com/home',
      $ios_url: 'http://example.com/ios',
      $deeplink_path: 'other'
    };

    let {channel, completed, error} = await this.buo.showShareSheet(
      shareOptions,
      linkProperties,
      controlParams,
    );

    if (error) {
      console.error('Error sharing via Branch: ' + error);
      return;
    }

    console.log('Share to ' + channel + ' completed: ' + completed);
  }
}

class MainScreen extends React.Component<any, any> {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Main Screen</Text>
      </View>
    );
  }
}

class OtherScreen extends React.Component<any, any> {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Other Screen</Text>
      </View>
    );
  }
}

class App extends React.Component<any, any> {
  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Other" component={OtherScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  text: {
    marginVertical: 10,
    fontSize: 20,
  },
  titleText: {
    color: '#000000',
    fontSize: 25,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  webView: {
    flex: 0.9,
    borderColor: '#2266aa',
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#cceeee',
    borderColor: '#2266aa',
    flex: 0.15,
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 5
  },
  buttonText: {
    color: '#2266aa',
    fontSize: 23,
    textAlign: 'center',
  },
  input: {
    height: 50,
    marginVertical: 10,
    borderWidth: 1,
    padding: 10,
    borderColor: 'gray',
    width: '100%',
    borderRadius: 10,
  },
  navbar: {
    height: 50,
    marginVertical: 10,
    borderWidth: 1,
    padding: 10,
    borderColor: 'black',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center'
  },
  navButton: {
    backgroundColor: '#cceeee',
    borderColor: '#2266aa',
    height: 40,
    width: '40%',
    justifyContent: 'center',
    borderRadius: 10,
  }
});
