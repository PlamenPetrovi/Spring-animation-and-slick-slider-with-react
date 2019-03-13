import styled from 'styled-components';
// Icons
import Plus from '../icons/plus'
import Bell from '../icons/bell'
import Download from '../icons/download'
import Minus from '../icons/minus'
import Play from '../icons/play'

export const DownloadIcon = styled(Download)`
    width: 35px;
    height: 35px;
    display: block;
    fill: #fff;
    margin: 0px auto 11px;
`

export const PlayIcon = styled(Play)`
    width: 70px;
    height: 70px;
    display: block;
    fill: #fff;
    margin: 0px auto 11px;
`

export const BellIcon = styled(Bell)`
    width: 33px;
    height: 33px;
    display: block;
    fill: #fff;
    margin: 0px auto 11px;
`
export const PlusIcon = styled(Plus)`
    width: 35px;
    height: 35px;
    display: block;
    fill: #fff;
    margin: 0px auto 11px;
`

export const MinusIcon = styled(Minus)`
    width: 35px;
    height: 35px;
    display: block;
    fill: #fff;
    margin: 0px auto 11px;
`

export const ModalClickOverlay = styled.div`
	position: fixed;
	left:0;
	right:0;
	bottom:0;
	top:0;
	z-index:1;
`;


export const ModalBottomWrapper = styled.div`
	padding: 35px;
`;

export const VideoButtonWrapper = styled.div`
    overflow: auto;
    border: 0px;
    background-color: rgba(0,0,0,0);
    margin: 25px 0px;
`

export const IconButton = styled.button`
	border: 0px;
    background-color: rgba(0,0,0,0);
    margin: 0px 15px;
    color: #ffffff73;
    font-size: 1rem;
    text-align: center;
    vertical-align:top;
    :hover {
        cursor: pointer;
    }
`
export const WaitingIcon = styled.div `
    display: flex;
    justify-content: center;
    height: 400px;
    align-items: center;
`
