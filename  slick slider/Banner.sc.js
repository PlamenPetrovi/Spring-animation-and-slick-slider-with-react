import React from 'react';
import { Keyframes, animated } from 'react-spring';
import delay from 'delay';
import styled from 'styled-components';
import Media from '../common/Media';

// Creates a spring with predefined animation slots
export const SectionContentSlider = Keyframes.Spring({
    // Slots can take arrays/chains,
    peek: [
        { y: 0, opacity: 1, from: { y: 50, opacity: 0 }, delay: 600 },
        { y: 0, delay: 600, opacity: 1 }
    ],
    // single items,
    open: {
        y: 0,
        opacity: 1,
        delay: 500
    },
    // or async functions with side-effects
    close: async call => {
        await delay(400);
        await call({ y: 50 });
    }
});

export const SliderItemArea = styled.section.attrs({
    id: `${prop => prop.id}`
})`
    .items-area {
        margin-left: 0px;

        .slick-slide {
            text-align: center;
            width: 170px;
            ${Media.higher`width: 190px`}
            ${Media.mediumHigher`width: 170px`}

            > div, .items {
                outline: none;
                padding: 2px;
            }

            .responsive-image {
                position: relative;
                background-position: 50% 50%;
                background-repeat: no-repeat;
                background-size: cover;
                overflow: hidden;
            }

            &:hover, &:focus {
                background-color: #131c25;
                
                .toggle-area {
                    visibility: visible;
                    opacity: 1;
                    transition: opacity .5s linear;
                }
            }    
        }
        .slick-dots {
            position: absolute;
            top: -16px;
            display: block;
            width: 100%;
            right: 2rem;
            padding: 0;
            margin: 0;
            list-style: none;
            text-align: right;
            height: 10px;
        }
        .slick-dots li {
            position: relative;
            display: inline-block;
            width: 25px;
            height: 3px;
            background-color: #fff;
            margin: 0 5px;
            padding: 0;
            cursor: pointer;
            opacity: 0.3;
        }

        li.slick-active {
            opacity: 1;
        }
        .slick-dots li button:before {
            display: none;
        }
    }
`

export const BannerInfo = styled.div`
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    text-align: left;
    padding: 0px 20px 4px;
    line-height: 1.2rem;
    color: #fff;
    width: 50%;
    border-radius: 0px;
    background-image: linear-gradient(to right,#3e48c3 50%,rgba(0,0,0,0));

    h1 {
        font-size: 14px;
        margin-bottom: 0px;
    }

    p {
        font-size: 12px;
        margin-top: 5px;    
    }
`

const ButtonStatus = styled.span`{
    background-color: #3e48c3;
    padding: 7px;
    font-size: 12px;
    display: inline-block;
}`;

export const SearchWrapper = styled.div`
    padding: 0px 17px;
    position: relative;
    width: 12rem;
    margin-right: 2rem;
`
