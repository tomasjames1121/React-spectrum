import styled from 'styled-components';

export const Wrapper = styled.div`
	position: fixed;
	min-height: 48px;
	top: 48px;
	display: flex;
	background-color: #ffffff;
	width: 54vw;
	padding: 24px;
	padding-right: 0;
	flex-direction: column;
	box-shadow: 0 4px 16px -8px black;
	overflow-y: scroll;
	z-index: 1;
`;

export const Section = styled.div`
	display: flex;
	flex-direction: column;
	justify-self: flex-end;
`;

export const Description = styled.p`
	font-size: 14px;
	display: inline-block;
	margin-bottom: 24px;
	max-width: 560px;
	max-height: 50%;
	line-height: 1.5;
	color: #363A4F;
`;

export const SectionLabel = styled.h4`
	font-size: 10px;
	display: inline-block;
	text-transform: uppercase;
	color: #9BA6AF;
	margin-top: 24px;
	margin-bottom: 4px;
	font-weight: bold;
`;

export const RowList = styled.div`
	display: flex;
	overflow-x: scroll;
	flex: 1 0 calc(15vh + 2px);
`;


export const TagList = styled.ul`
	list-style: none;
	display: flex;
	flex: 1 0 auto;
`;

export const Tag = styled.li`
	height: 24px;
	padding: 0 12px;
	line-height: 24px;
	vertical-align: middle;
	border-radius: 12px;
	word-wrap: none;
	white-space: no-wrap;
	background-color: #CBD9ED;
	color: #ffffff;
	text-transform: uppercase;
	font-size: 10px;
	font-weight: bold;
	margin-right: 8px;

	&:last-of-type {
		margin-right: 0;
	}
`;

export const Meta = styled.div`
  display: block;
  overflow: auto;
`

export const AuthorName = styled.small`
  display: block;
  overflow: auto;
  text-indent: 1rem;
`

export const Media = styled.img`
	width: 100px;
	margin: 8px 8px 0 0;
	border-radius: 4px;
  border: 2px solid transparent;
  &:hover {
    border-color: #4422ED;
  }
`;