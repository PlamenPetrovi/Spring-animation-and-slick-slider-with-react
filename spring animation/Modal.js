import React, {Component} from 'react';
import _ from 'lodash'
import {animated,Transition} from 'react-spring';
import {connect} from 'react-redux';
import {ClipLoader} from 'react-spinners';
import {Col, Nav, NavItem, Row, Tab} from 'react-bootstrap';
import {
    BellIcon,
    DownloadIcon,
    IconButton,
    MinusIcon,
    ModalBottomWrapper,
    ModalClickOverlay,
    PlayIcon,
    PlusIcon,
    VideoButtonWrapper,
    WaitingIcon
} from './Modal.sc'
import SeasonMovie from './MovieSeason'
import {getSerieLastWatching, getEpisodeLink, selectSeason , calculateSeasonProgress} from '../../actions/tvDetail';
import {resetDetailData} from '../../actions/movieDetail'
import AdminApi from '../../api/AminApi'
import {SectionContent} from '../common/Utils';
import HeaderX from '../common/HeaderX';
import SliderY from '../common/SliderY';
import Progress from '../common/Progress';
import {resetSuggestionData} from '../../actions/suggestion'
import {getWatchlist} from '../../actions/watchlist';
import {DefaultPlayer as Video} from 'react-html5video';
import 'react-html5video/dist/styles.css';
import LottieSpinner from '../common/LottieSpinner';
import {stat} from 'fs';

const mod = [5, 4, 3, 2, 1]
var countdownTimer = null

class Modal extends Component {
    constructor(props) {
        super(props)
        this.state = {
            autoPlay: false,
            episode: 0,
            episodeTime: 0,
            movieTime: 0,
            progress: 0,
            isInWatchlist: false,
            countdown: 10,
            showCountdown: false,
            isVideoFullScreen: false,
            isClickPlay: false,
            posterImage: null,
            loadedFirstTime: true,
            stateInit: true,
            tabKey: null,
            watchlistLoading: false,
            showMoreLikeThisAnimation: false,
            downloadClicked:false,
            seasons:this.getSeasons(),
            realTimeEpisodesProgressInterval:null,
            cursorTimeout: null,
            dimensionsPoster: {
                width: 0,
                height: 0,
            }
        }

        this.videoRef = React.createRef();
        this.videoModalRef = React.createRef();

        this.idleCursor = this.idleCursor.bind(this);
    }



    componentDidMount() {
        this.props.getWatchlist(1, '')
        document.addEventListener('fullscreenchange', exitHandler);
        document.addEventListener('webkitfullscreenchange', exitHandler);
        document.addEventListener('mozfullscreenchange', exitHandler);
        document.addEventListener('MSFullscreenChange', exitHandler);

        let self = this;
        function exitHandler(){
            if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
                self.state.isVideoFullScreen = false;
                document.getElementsByClassName('rh5v-DefaultPlayer_component')[0].style.height = "100%";
            }
        }
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        let id = null;
        let type = null;
        if (this.props.data){
            id = this.props.data.info.id;
            type = this.props.data.info.type;
        }

        if (id){
            if (this.state.loadedFirstTime){
                if (type === 'movie'){
                    if (this.videoRef.current){
                        this.state.loadedFirstTime = false;
                        AdminApi.playMovie(id).then(time => {
                            this.videoRef.current.videoEl.addEventListener('loadedmetadata', function () {
                                this.currentTime = time.timestamp;
                            }, false);
                        }).catch(e => {
                        });
                    }
                }

                if (type === 'series') {
                    if (this.videoRef.current){
                        this.state.loadedFirstTime = false;
                        let {activeSeason} = this.props

                        // seek last time
                        this.continueWatching(id, activeSeason, false, () => {
                            let currentTime = this.state.episodeTime

                            if(currentTime > 0) {
                                this.videoRef.current.videoEl.addEventListener('loadedmetadata', function () {
                                    this.currentTime = currentTime;
                                }, false);
                            }
                        })
                    }
                }
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.data || !nextProps.data.info) return;

        if (!this.props.watchlist.length && nextProps.watchlist.length) {
            let watchlistId = nextProps.watchlist.map(w => w.info.id)
            if (watchlistId.indexOf(this.getInfo().id) === -1) {
                this.state.isInWatchlist = false
            } else {
                this.state.isInWatchlist = true
            }
        }

        if(this.state.stateInit) {
            if (nextProps.data.info.lastEpisode !== this.state.episode) {
                this.props.selectSeason(nextProps.data.info.activeSeason);
                this.state.episode = nextProps.data.info.lastEpisode;
                this.state.progress = nextProps.data.info.progress
                this.state.stateInit = false;
            }
        }
        
        if (nextProps.data.info.movieTime != this.state.movieTime ) {
            this.state.movieTime = nextProps.data.info.movieTime;
            this.state.progress = nextProps.data.info.progress
        }
    }


    shouldComponentUpdate(nextProps, nextState) {
        return !document.fullscreenElement;
    }



    componentWillUnmount() {
        if (!this.getInfo()) return;

        let {activeSeason} = this.props
        let {type, id} = this.getInfo()
        let {episode} = this.state
        if (this.state.isClickPlay) {
            let timestamp = this.videoRef.current.state;
            this.storePlayingTime(type, id, activeSeason, episode, timestamp.currentTime,timestamp.duration)
        }
        clearInterval(this.state.realTimeEpisodesProgressInterval)
        this.props.resetSuggestionData()
        this.props.resetDetailData();
    }


    selectSeason = (seasonNumber) => {
        this.props.selectSeason(seasonNumber)
        let {id} = this.getInfo()

        if (!this.state.isClickPlay){
            // seek last episode
            this.continueWatching(id, seasonNumber, true, null)
        }
    }



    storePlayingTime = (type, id, season, episode, timestamp,duration) => {
        if (type === 'movie') {
            AdminApi.pauseMovie(id, timestamp).then(() => {
            }).catch(e => {
            })
        } else if (type === 'series') {
            AdminApi.pauseSerie(id, season, episode, timestamp,duration).then(() => {
            }).catch(e => {
            })
        }
    }

    selectEpisode = (episodeId, showTimeCountDown = true) => {
        // Store current episode
        let {activeSeason} = this.props
        let {type, id} = this.props.data.info
        if (this.state.isClickPlay) {
            if (this.videoRef.current){
                let videoRef = this.videoRef.current.state;
                this.storePlayingTime(type, id, activeSeason, this.state.episode, videoRef.currentTime,videoRef.duration)
            }
        }

        this.videoModalRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
        })

        if(!this.state.isClickPlay)
            this.setState({
                isClickPlay:true
            })
        //Play new episode
        this.state.episode = episodeId
        this.props.getEpisodeLink(id, activeSeason, episodeId);

        this.props.updateSeason(this.getInfo().id);
            if (showTimeCountDown) {
                this.setState({
                    autoPlay: true,
                    showCountdown: true,
                    countdown: 10
                })
                countdownTimer = setInterval(() => {
                    this.state.countdown = this.state.countdown - 1
                    if (!this.state.countdown) {
                        this.setState({
                            showCountdown: false
                        })
                        clearInterval(countdownTimer)
                    }
                    this.forceUpdate()
                }, 1000)
            } else {
                this.setState({
                    isCLickPlay:false,
                    autoPlay: true
                })
                this.forceUpdate()
            }

    }

    continueWatching = async (serieId, activeSeason, select, callback) => {
        let watchingHistory = await getSerieLastWatching(serieId, activeSeason)
        
        if(watchingHistory) {
            this.state.episode = parseInt(watchingHistory.lastEpisode)
            this.state.episodeTime = watchingHistory.lastEpisodeTime
            this.state.progress = 
                watchingHistory.lastEpisodeTime / watchingHistory.lastEpisodeTotalTime * 100

            if(select) { // update episode link
                return await this.selectEpisodeWithoutStore()
            } else {
                return callback()
            }
        } else {
            this.state.episode = 1;
            this.state.episodeTime = 0;
            this.state.progress = 0;
            this.forceUpdate()
        }
    }

    selectEpisodeWithoutStore = async () => {
        let {type, id} = this.props.data.info
        let {activeSeason} = this.props
        let {episode} = this.state;

        if(type === 'movie') {
            return
        }

        await this.props.getEpisodeLink(id, activeSeason, episode);
        await this.props.updateSeason(this.getInfo().id);
        this.setState({
            isCLickPlay:false,
            autoPlay: true
        })
        await this.forceUpdate()
    }

    showVideoFullScreen = (elem) => {
        let rfs = elem.requestFullscreen
            || elem.webkitRequestFullScreen
            || elem.mozRequestFullScreen
            || elem.msRequestFullscreen
        ;
        rfs.call(elem)
    }

    onVideoEnd = () => {
        let {activeSeason} = this.props
        let {id} = this.props.data.info
        let season = activeSeason


        if (this.state.episode == this.props.numOfEpisode) {
            this.props.selectSeason(season + 1)
            season = season + 1
            this.state.episode = 1
        } else {
            this.state.episode = this.state.episode + 1
        }

        this.props.getEpisodeLink(id, season, this.state.episode)
        this.setState({
            autoPlay: true,
            showCountdown: true,
            countdown: 10
        })

        countdownTimer = setInterval(() => {
            this.state.countdown = this.state.countdown - 1
            if (!this.state.countdown) {
                this.setState({
                    showCountdown: false
                })
                clearInterval(countdownTimer)
            }
            this.forceUpdate()
        }, 1000)
    }



    onVideoPause = () => {
        let {activeSeason} = this.props
        let {type, id} = this.props.data.info
        let {episode} = this.state;
        let videoRef = this.videoRef.current.state;
        this.storePlayingTime(type, id, activeSeason,episode, videoRef.currentTime,videoRef.duration)
    }


    handleFullScreenClick = () => {
        if (this.state.isVideoFullScreen) {
            document.getElementsByClassName('rh5v-DefaultPlayer_component')[0].style.height = "100%";
            document.exitFullscreen();
            this.setState({
                isVideoFullScreen: false
            });
            // clear cursor idle timer
            clearTimeout(this.state.cursorTimeout);
            this.hideControls(false)
        } else {
            this.showVideoFullScreen(document.getElementById('outsideVideo'));
            document.getElementsByClassName('rh5v-DefaultPlayer_component')[0].style.height = "100vh";
            this.setState({
                isVideoFullScreen: true
            })
        }
    }




    addToWatchList = () => {
        let {info} = this.props.data
        this.setState({
            watchlistLoading: true,
        })
        this.state.watchlistLoading = true;
        setTimeout(() => {
            if (!this.state.isInWatchlist) {
                AdminApi.addToWatchlist(info.id).then((result) => {
                    console.log('add to watchlist success:', result)
                    this.state.isInWatchlist = true
                    this.state.watchlistLoading = false;

                    this.forceUpdate()
                }).catch(e => {
                    console.log('add to watchlist failed:', e);
                    this.state.watchlistLoading = false;

                })
            } else {
                AdminApi.removeInWatchlist(info.id).then((result) => {
                    console.log('remove in watchlist success:', result)
                    this.state.isInWatchlist = false;
                    this.state.watchlistLoading = false;
                    this.forceUpdate()

                }).catch(e => {
                    console.log('remove in watchlist failed:', e)
                    this.state.watchlistLoading = false;
                })
            }
        }, 1000)

    }

    renderWatchListButton = () => {
        if (this.state.watchlistLoading) {
            return (
                <IconButton style={{width:'75px'}}>
                    <LottieSpinner height={45} width={45}/>
                    My List
                </IconButton>
            );
        } else {
            return (
                <IconButton onClick={this.addToWatchList} style={{width:'75px'}}>
                    {
                        !this.state.isInWatchlist ? <PlusIcon/> : <MinusIcon/>
                    }
                    My List
                </IconButton>
            );
        }
    };


    playVideo = () => {
        this.setState({
            isClickPlay: true,
            autoPlay: true,
            posterImage: null
        })

        if (!this.state.realTimeEpisodesProgressInterval){

            let interval = setInterval(()=>{
                let {activeSeason} = this.props;
                let {type, id} = this.getInfo();
                let {episode} = this.state;
                let timestamp = this.videoRef.current.state;
                this.storePlayingTime(type, id, activeSeason, episode, timestamp.currentTime,timestamp.duration);
                if (type === 'series'){
                    this.props.updateSeason(this.getInfo().id,this.props.seasons);
                }
            },30000);

            this.setState({
                realTimeEpisodesProgressInterval:interval
            })
        }

    }


    getLink = () => {
        if (!this.props.data || !this.props.data.link) return null
        return this.props.data.link
    }

    getInfo = () => {
        if (!this.props.data || !this.props.data.info) return null
        return this.props.data.info
    }

    getSeasons = () => {
        if (!this.props.data || !this.props.data.seasons) return null
        // this.state.seasons = this.props.data.se
        return this.props.data.seasons
    }

    getSlideToScroll = () => {
        let {suggestions} = this.props
        if (!suggestions || !suggestions.data.length) return 1
        return mod.find(d => suggestions.data.length % d === 0)
    };

    handleSelect = () => {
    }

    handleSuggestionClick = () => {


        this.state.showMoreLikeThisAnimation = true;

        setTimeout(() => {
            this.setState({
                showMoreLikeThisAnimation: false,
            });
            this.videoModalRef.current.scrollTo({
                top: 0,
                // behavior: 'smooth'
            })
        }, 2000)
    }

    handleDownloadClick = () =>{

        this.state.downloadClicked = true;
        setTimeout(()=>{
            let link = document.createElement("a");
            link.download = name;
            link.href = this.getLink().dl;
            link.click();
            this.setState({
                downloadClicked:false
            })
        },2000);
    }

    hideControls = (hide) => {
        let controls = document.getElementsByClassName("rh5v-DefaultPlayer_controls")[0]
        let video = document.getElementById("outsideVideo")
        let overlay = document.getElementsByClassName('rh5v-Overlay_component')[0]
        
        if(!controls || !video || !overlay) return

        if(hide && this.state.isVideoFullScreen) {
            // hide controls
            controls.style.display = "none";
            // hide cursor
            overlay.style.cursor = "none";
            video.style.cursor = "none";
        } else if(controls.style.display != "flex" || 
                    overlay.style.cursor != "pointer" ||
                    video.style.cursor != "auto") {
            // show controls
            controls.style.display = "flex";
            // show cursor
            overlay.style.cursor = "pointer";
            video.style.cursor = "auto";
        }
    }

    idleCursor(e) {        
        if(this.state.isVideoFullScreen) {
            // e.preventDefault();
            this.hideControls(false);
        
            clearTimeout(this.state.cursorTimeout);
            this.state.cursorTimeout = setTimeout(() => this.hideControls(true), 5000);
        }
    }

    renderVideoContent = () => {
        let state = this.state.open === undefined ? 'peek' : 'close';

        let prop_data = this.props.data;
        let info,directors,characters;
        info = directors = characters   =null;
        if (prop_data){
            info = prop_data.info;
            directors = prop_data.directors;
            characters = prop_data.characters;
        }
        let type = null

        this.state.posterImage = info ? info.background : 'https://static1.squarespace.com/static/59053f105016e1dcad837cdc/t/5a0795a2c83025174dec543a/1520725141701/Black.jpg';
        let defaultTabType = null;

        if (info) {
            type = info.type
            defaultTabType = type === 'movie' ? 8 : 7;
        }



        let {activeSeason, seasons , renderIndex} = this.props;

        let epTitle = null
        
        if(type === 'series') {
            try {
                epTitle = this.state.episode > 0 ? seasons[activeSeason].episodes[this.state.episode - 1].title : null
            } catch (e) {
            }
        }

        let displayStyle = this.state.showMoreLikeThisAnimation?'none':'block';
        return (
            <div  ref={this.videoModalRef} className='modal-content-area' style={{display:displayStyle}}>
                {
                    this.props.loadingSeasonLink ?
                        <WaitingIcon>
                            <ClipLoader color={'#3e4dbc'} size={42} sizeUnit={"px"}/>
                        </WaitingIcon>
                        :
                        <div style={{position: 'relative'}} id='outsideVideo' onMouseMove={e => this.idleCursor(e)}>
                            {
                                !this.state.isClickPlay ?
                                    <div className='modal-banner-image'>
                                            <img
                                                src={this.state.posterImage}
                                                className='img-responsive max-h-500'
                                                onLoad={
                                                    ({target: img}) => {
                                                        this.setState(
                                                            {
                                                                dimensionsPoster: {
                                                                    height: img.naturalHeight,
                                                                    width: img.naturalWidth
                                                                }
                                                            }
                                                        )
                                                    }
                                                }
                                            />
                                        <div style={{
                                            position: "absolute",
                                        }}>
                                            <IconButton
                                                onClick={this.playVideo}
                                            >
                                                <PlayIcon/>
                                            </IconButton>
                                        </div>
                                        {
                                            (this.state.episode 
                                            && !(this.state.episode == 1 && activeSeason == 1 && this.state.episodeTime == 0) 
                                            || this.state.movieTime) ?
                                            <div className='continue-watching'>
                                                <p>Continue Watching</p>
                                                {
                                                    type === 'series' ?
                                                    <p>S{activeSeason} E{this.state.episode} {epTitle}</p>
                                                    : null
                                                }
                                                <Progress percentage={this.state.progress + '%'}></Progress>
                                            </div>
                                            :
                                            null
                                        }
                                    </div>
                                    :
                                    <Video disableremoteplayback="true"
                                           onEnded={this.onVideoEnd}
                                           onPause={this.onVideoPause}
                                           width='100%'
                                           autoPlay={this.state.autoPlay}
                                           controls={['PlayPause', 'Seek', 'Time', 'Volume', 'Fullscreen']}
                                           poster={info ? info.background : ''}
                                           onFullscreenClick={this.handleFullScreenClick}

                                           ref={this.videoRef}
                                           src={this.getLink() ? (this.getLink().jwplayer && this.getLink().jwplayer.length ? this.getLink().jwplayer[0].file : null) : null}/>
                            }
                            {
                                this.state.showCountdown ?
                                    <div style={{
                                        backgroundColor: 'black',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        zIndex: 999
                                    }}>
                                        <label style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            color: 'white',
                                            padding: '5px 10px',
                                            margin: 5,
                                            backgroundColor: '#0487d6',
                                            position: 'absolute',
                                            right: 0,
                                            bottom: 0
                                        }}>
                                            Next ep in {this.state.countdown} seconds
                                        </label>
                                    </div>
                                    :
                                    null
                            }
                        </div>

                }
                <ModalBottomWrapper style={{padding: 0}}>
                    {!this.state.isClickPlay&&<div className="shadow-title"/>}

                    <h1 className="modal-title">{info?info.title:''}</h1>
                    <ul className="info-area inline">
                        <li>{info ? info.content_rating : ''}</li>
                        {
                            info && info.type === 'series' ?
                                <li>{seasons ? Object.keys(seasons).length : 0} seasons</li>
                                :
                                null
                        }
                        <li>{info ? info.runtime : ''} minutes</li>
                        <li>
                            {
                                info ?
                                    info.type === 'movie' ?
                                        new Date(info.release_date).getFullYear()
                                        :
                                        new Date(info.release_date).getFullYear() + ' - ' + new Date().getFullYear()
                                    : null
                            } &nbsp;
                            <span
                                className="tags">{this.getLink() ? (this.getLink().jwplayer && _.map(this.getLink().jwplayer, c => c.label).indexOf('1080p') === -1 ? 'SD' : 'HD') : ''}</span>
                            <span className="tags">CC</span>
                        </li>
                    </ul>
                    <div className="description-area">
                        <div className="fleft">
                            <p>{info ? info.plot : ''}</p>
                        </div>
                        <div className="fright">
                            <ul className="block-area">
                                <li>
                                    <label>Genres: </label>
                                    <a href="#">{info ? info.genre : ''}</a>
                                </li>
                                <li>
                                    <label>Cast: </label>
                                    <a href="#">
                                        {characters && characters.length > 0 && characters.slice(0,8).map((character,index)=><label key={character.actor._id} className='m-r-3'>{character.actor.name} {index === 7?'':','} </label>)}
                                        {characters && characters.length ===0 && <span>Unknown</span>}
                                        </a>
                                </li>
                                <li>
                                    <label>Directors: </label>
                                    <a href="#">
                                        {directors && directors.length>0 && directors.map((director,index)=><label key={director._id} className='m-r-3'>{director.name} {index === (directors.length-1)?'':','}</label>)}
                                        {directors && directors.length===0 && <span>Unknown</span>}

                                    </a>

                                </li>
                            </ul>
                        </div>
                    </div>

                    <VideoButtonWrapper>
                        {
                            this.renderWatchListButton()
                        }
                        {

                            this.state.downloadClicked && <IconButton style={{width:'85px'}}>
                                <LottieSpinner height={45} width={45}/>
                                Download
                            </IconButton>
                        }
                        {
                            !this.state.downloadClicked &&  <a  href="#" onClick={this.handleDownloadClick}  >
                                <IconButton>
                                    <DownloadIcon style={{width:'75px'}}/>
                                    Download
                                </IconButton>
                            </a>
                        }

                        {
                            info && info.type !== 'movie' &&
                            <IconButton>
                                <BellIcon/>
                                Follow
                            </IconButton>
                        }
                    </VideoButtonWrapper>

                    <Tab.Container id="left-tabs-area"
                                   activeKey={defaultTabType} onSelect={this.handleSelect}>
                        <Row className="clearfix">
                            <Col sm={4}>
                                <Nav bsStyle="pills" stacked className="video-top-tabs">
                                    {
                                        this.getInfo() && this.getInfo().type !== 'movie' ?
                                            <NavItem eventKey={7}>EPISODES</NavItem>
                                            :
                                            null
                                    }
                                    {
                                        this.getInfo() && this.getInfo().trailer ?
                                            <NavItem eventKey={8}>TRAILERS & MORE</NavItem>
                                            :
                                            null
                                    }
                                </Nav>
                            </Col>
                            <Col sm={8}>
                                <Tab.Content animation>
                                    <Tab.Pane eventKey={7}>
                                        <div className="relate-container">
                                            {
                                                seasons ?
                                                    <Tab.Container id="left-tabs-area" defaultActiveKey={activeSeason}
                                                                   onSelect={this.selectSeason}>
                                                        <Row className="clearfix">
                                                            <Col sm={4}>
                                                                <Nav bsStyle="pills" stacked>
                                                                    {
                                                                        Object.keys(seasons).map((key, idx) =>
                                                                            <NavItem eventKey={idx + 1}
                                                                                     key={idx}>Season {idx + 1} </NavItem>)
                                                                    }
                                                                </Nav>
                                                            </Col>
                                                            <Col sm={8}>
                                                                <Tab.Content animation>
                                                                    {
                                                                        Object.keys(seasons).map((key, idx) =>
                                                                            <Tab.Pane eventKey={idx + 1} key={idx}>
                                                                                <SeasonMovie
                                                                                    episodes={seasons[key].episodes}
                                                                                    info={seasons[key].info}
                                                                                    renderIndex={renderIndex}
                                                                                    episodeTime={info?info.runtime:''}
                                                                                    onEpisodeClick={this.selectEpisode}/>
                                                                            </Tab.Pane>)
                                                                    }
                                                                </Tab.Content>
                                                            </Col>
                                                        </Row>
                                                    </Tab.Container>
                                                    :
                                                    null
                                            }
                                        </div>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey={8}>
                                        <div className="relate-container">
                                            {
                                                info && info.trailer ?
                                                    <iframe width="100%" height="480px" src={info.trailer}
                                                            frameBorder="0" allowFullScreen/>
                                                    :
                                                    null
                                            }
                                        </div>
                                    </Tab.Pane>

                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>

                    {
                        this.props.suggestions && this.props.suggestions.data.length ?
                            <SectionContent native="native" state={state}>
                                {
                                    ({x}) =>
                                        (<animated.div className="items-container" style={{
                                            opacity: x.interpolate({output: [0.85, 1]}),
                                            transform: x.interpolate(x => `translate3d(${x}%,0,0)`)
                                        }}>
                                            <HeaderX dataHeader={{x: x, title: 'More like this'}}/>
                                            <SliderY slidesToScroll={this.getSlideToScroll()} datas={{
                                                loading: this.props.suggestions.loading,
                                                data: this.props.suggestions.data
                                            }} dataState={state} onProgramClick={this.handleSuggestionClick} showWhiteText={true} showBlur={false}/>
                                        </animated.div>)
                                }
                            </SectionContent>
                            :
                            null
                    }
                </ModalBottomWrapper>
            </div>
        );
    }


    renderMoreListThisAnimation = (data) => {
        return (
            <animated.div style={{...data}} className="model-content loading-content">
                <div className='modal-loading-div'>
                    <LottieSpinner height={50} width={50}/>
                </div>
            </animated.div>

        );
    }


    render() {
        let {showMoreLikeThisAnimation} = this.state;

        return (
            <animated.div className="modal-container" style={this.props.styles}>
                {
                    showMoreLikeThisAnimation &&
                        <Transition
                            items={showMoreLikeThisAnimation}
                            native
                            reset
                            unique
                            from={{ opacity: 0, transform: 'translate3d(100%,0,0)' }}
                            enter={{ opacity: 1, transform: 'translate3d(0%,0,0)' }}
                            leave={{ opacity: 0, transform: 'translate3d(-50%,0,0)' }}
                        >
                            {
                                showMoreLikeThisAnimation  => (data) => this.renderMoreListThisAnimation(data)
                            }
                        </Transition>
                }
                {
                     this.renderVideoContent()
                }
                <ModalClickOverlay onClick={e => this.props.handleCloseModal(e)}/>
            </animated.div>
        )
    }
}


const mapStateToProps = state => {
    let {loadingSeasonLink, data, activeSeason} = state.programDetail
    let suggestionData = state.suggestion;
    return {
        loadingSeasonLink: loadingSeasonLink,
        data: data,
        activeSeason: activeSeason,
        numOfEpisode: data && data.seasons ? data.seasons[activeSeason].episodes.length : 0,
        suggestions: suggestionData,
        watchlist: state.watchlist ? state.watchlist.data : [],
        seasons:state.tvs.seasons,
        renderIndex:state.tvs.renderIndex
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        updateSeason:(id,seasons) => dispatch(calculateSeasonProgress(id,seasons)),
        selectSeason: (seasonNumber) => dispatch(selectSeason(seasonNumber)),
        getEpisodeLink: (movieId, seasonNumber, episodeNumber) => dispatch(getEpisodeLink(movieId, seasonNumber, episodeNumber)),
        resetSuggestionData: () => dispatch(resetSuggestionData()),
        getWatchlist: (page, sortby) => dispatch(getWatchlist(page, sortby)),
        resetDetailData: () => dispatch(resetDetailData())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Modal);