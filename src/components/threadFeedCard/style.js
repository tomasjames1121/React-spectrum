import styled from 'styled-components';
import { Link } from 'react-router-dom';
import {
  FlexCol,
  FlexRow,
  Transition,
  Shadow,
  hexa,
  Gradient,
} from '../globals';
import Card from '../card';

export const StyledThreadFeedCard = styled(Card)`
  padding: 16px 20px 16px 20px;
  margin-bottom: 16px;
  transition: ${Transition.hover.off};

  &:hover {
    transition: ${Transition.hover.on};
    box-shadow: ${Shadow.high} ${({ theme }) => hexa(theme.text.placeholder, 0.5)};
  }
`;

export const CardLink = styled(Link)`
  position: absolute;
  display: inline-block;
  height: 100%;
  width: 100%;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
`;

export const CardContent = styled(FlexCol)`
  align-self: flex-start;
  position: relative;
  z-index: 2;
  align-items: flex-start;
`;

export const Title = styled.h2`
  font-weight: 800;
  font-size: 20px;
  line-height: 1.4;
  flex: 0 0 auto;
  color: ${({ theme }) => theme.text.default};
`;

export const MetaRow = styled(FlexRow)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
`;

export const ParticipantHeads = styled(FlexRow)`
  align-items: center;

  > a {
    margin-left: 4px;
    margin-top: 4px;
  }
`;

export const Participant = styled.img`
  height: 1.5rem;
  width: 1.5rem;
  border-radius: 100%;
  object-fit: cover;
  background-color: ${({ theme }) => theme.generic.default};
  background-image: ${({ theme }) => Gradient(theme.generic.alt, theme.generic.default)};
`;

export const Creator = styled.div`
  height: 2rem;
  width: 2rem;
  padding: 0.125rem;
  border-radius: 100%;
  border: 2px solid ${({ theme }) => theme.brand.alt};
`;

export const Meta = styled.span`
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  vertical-align: middle;
  color: ${({ theme }) => theme.text.alt};
`;

export const Location = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.text.alt};

  > a:hover {
    color: ${({ theme }) => theme.brand.alt};
    text-decoration: underline;
  }
`;
