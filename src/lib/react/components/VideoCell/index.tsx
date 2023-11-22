import { cloneElement, JSXElementConstructor, ReactElement } from "react";
import PropTypes from "prop-types";
import cn from "classnames";

import styles from "./styles.css";

import { fitToBounds } from "../VideoStageLayout/VideoGrid/gridUtils";

function VideoCell({
    aspectRatio,
    children,
    className,
    height,
    style,
    width,
    withRoundedCorners = false,
    withShadow = true,
    ...rest
}: {
    aspectRatio: number;
    children: ReactElement<any, string | JSXElementConstructor<any>>;
    className: string;
    height: number;
    style: React.CSSProperties;
    width: number;
    withRoundedCorners?: boolean;
    withShadow?: boolean;
}) {
    let contentWidth = width;
    let contentHeight = height;
    let leftOffset = 0;
    let topOffset = 0;

    if (aspectRatio) {
        ({ width: contentWidth, height: contentHeight } = fitToBounds(aspectRatio, {
            width,
            height,
        }));
        // Abs center content in cell
        leftOffset = (width - contentWidth) / 2;
        topOffset = (height - contentHeight) / 2;
    }

    const contentStyle = {
        width: `${Math.round(contentWidth)}px`,
        height: `${Math.round(contentHeight)}px`,
        ...(leftOffset || topOffset
            ? { transform: `translate3d(${Math.round(leftOffset)}px, ${Math.round(topOffset)}px, 0)` }
            : {}),
    };

    return (
        <div className={cn(styles.VideoCell, className)} style={style}>
            <div className={cn(styles.VideoCellContent)} style={contentStyle} {...rest}>
                {cloneElement(children, { contentWidth, contentHeight, withRoundedCorners, withShadow })}
            </div>
        </div>
    );
}

VideoCell.propTypes = {
    aspectRatio: PropTypes.number,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    height: PropTypes.number,
    style: PropTypes.object,
    width: PropTypes.number,
    withRoundedCorners: PropTypes.bool,
    withShadow: PropTypes.bool,
};

export default VideoCell;
