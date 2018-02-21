// @flow
import * as React from 'react';
import { StripeProvider, Elements } from 'react-stripe-elements';
import { PUBLIC_STRIPE_KEY } from '../../api/constants';
import type { GetCommunitySettingsType } from 'shared/graphql/queries/community/getCommunitySettings';
import Form from './form';

type Props = {
  community: GetCommunitySettingsType,
  render: Function,
  onCardSaved?: Function,
};

type State = {
  stripe: ?any,
};

class CardForm extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = { stripe: null };
  }

  componentDidMount() {
    // componentDidMount only runs in a browser environment.
    // In addition to loading asynchronously, this code is safe to server-side render.

    // You can inject a script tag manually like this,
    // or you can use the 'async' attribute on the Stripe.js v3 <script> tag.

    // if we've already loaded the script to the dom, dont do it again
    const stripeJs = document.createElement('script');
    stripeJs.id = 'stripe-js-script';
    stripeJs.src = 'https://js.stripe.com/v3/';
    stripeJs.async = true;
    stripeJs.onload = () => {
      this.setState({
        stripe: window.Stripe(PUBLIC_STRIPE_KEY),
      });
    };
    document.body && document.body.appendChild(stripeJs);
  }

  componentWillUnmount() {
    const script = document.getElementById('stripe-js-script');
    if (script) script.remove();
  }

  render() {
    const { stripe } = this.state;
    return (
      <StripeProvider stripe={stripe}>
        <Elements>
          <Form
            community={this.props.community}
            onCardSaved={this.props.onCardSaved}
          >
            {({ isLoading }) => this.props.render({ isLoading })}
          </Form>
        </Elements>
      </StripeProvider>
    );
  }
}

export default CardForm;
