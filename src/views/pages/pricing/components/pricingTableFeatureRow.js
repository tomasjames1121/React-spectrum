// @flow
import * as React from 'react';
import Icon from 'src/components/icons';
import {
  PlanFeatureContainer,
  PlanFeatureContent,
  PlanFeatureText,
  PlanFeatureTitle,
  PlanFeatureSubtitle,
  PriceLabel,
} from '../style';

type Props = {
  title: string,
  subtitle: string,
  icon?: string,
  color?: string,
  priceLabel?: string,
};

class PricingTableFeatureRow extends React.Component<Props> {
  render() {
    const {
      title,
      subtitle,
      icon = 'checkmark',
      color = 'success',
      priceLabel,
    } = this.props;

    return (
      <PlanFeatureContainer color={color}>
        <PlanFeatureContent>
          <Icon glyph={icon} size={24} />
          <PlanFeatureText>
            <PlanFeatureTitle>{title}</PlanFeatureTitle>
            {subtitle && <PlanFeatureSubtitle>{subtitle}</PlanFeatureSubtitle>}
          </PlanFeatureText>
        </PlanFeatureContent>

        {priceLabel && <PriceLabel color={color}>{priceLabel}</PriceLabel>}
      </PlanFeatureContainer>
    );
  }
}

export default PricingTableFeatureRow;
