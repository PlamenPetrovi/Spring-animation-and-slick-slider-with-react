import React, { Component } from 'react'
import { connect } from 'react-redux';
import { ClipLoader } from 'react-spinners'
import Slider from 'react-slick'
import { animated } from 'react-spring'
import { getMovie } from '../../actions/movieDetail';
import { getSerie } from '../../actions/tvDetail';
import { SectionBlurRight, SectionBlurLeft } from '../common/Utils'
import { SectionContentSlider, SliderItemArea, BannerInfo, ButtonStatus } from './Banner.sc'
import { Settings } from './BannerConfig'
import ProgressiveImage from '../common/ProgressiveImage'
import { getSuggestions, resetSuggestionData } from '../../actions/suggestion'
import { BannerSkeleton } from '../common/ObjectSkeleton'

class Banner extends Component {

  handleShowDetail = (program) => {
    this.props.resetSuggestionData()
    if (!program) return
    if (program.type === 'movie') {
      this.props.getMovie(program.id);
    } else if (program.type === 'series') {
      this.props.getSerie(program.id);
    }
    this.props.getSuggestions(program.type, program.id)
    this.props.onProgramClick()
  }

  render() {
    const { dataState, datas } = this.props;

    return (
      <SectionContentSlider native="native" state={dataState}>
        {
          ({ y, ...opacity }) =>
            (
              <SliderItemArea className="banner-top">
                {
                  <animated.div className="items-area" style={{
                    ...opacity,
                    transform: y.interpolate(y => `translate3d(0, ${y}%,0)`)
                  }}>

                    <SectionBlurLeft />
                    <SectionBlurRight />
                    {
                      datas.data && datas.data.length ?
                      <Slider {...Settings} >
                        {
                          datas.data.map((item, index) => (
                            <div className="items" key={`slider-${index}`}>
                              <div className="responsive-image">
                              <a href="javascript:void(0)" onClick={() => this.handleShowDetail(item)}>
                                  <ProgressiveImage src={`${item.background}`} alt={item.title} className="img-toggle" />
                                </a>
                                <BannerInfo>
                                  <h1>{item.title}</h1>
                                  {item.year ? <p>{item.year}</p> : undefined}
                                </BannerInfo>
                              </div>
                            </div>
                          ))
                        }
                      </Slider>
                      :
                      <BannerSkeleton numberOfItems={Settings.slidesToShow} width={100/Settings.slidesToShow + '%'}></BannerSkeleton>
                    }
                  </animated.div>
                }
              </SliderItemArea>
            )
        }
      </SectionContentSlider>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    getMovie: (titleId) => dispatch(getMovie(titleId)),
    getSerie: (titleId) => dispatch(getSerie(titleId)),
    getSuggestions: (type, id) => dispatch(getSuggestions(type, id)),
    resetSuggestionData: () => dispatch(resetSuggestionData())
  }
}
export default connect(null, mapDispatchToProps)(Banner);