import { forwardRef } from "react";
import cn from "classnames";
import PropTypes from "prop-types";
import { EllipsisIcon } from "react-components";

import styles from "./styles.css";

const VideoCellMoreButton = forwardRef(({ className, isSubgrid, onClick, ...rest }, ref) => {
    return (
        <button
            className={cn(
                "jstest-video-cell-more-button",
                className,
                isSubgrid ? styles.subgridMenuButton : styles.menuButton
            )}
            onClick={onClick}
            aria-label={"More"}
            aria-haspopup={"menu"}
            ref={ref}
            {...rest}
            tabIndex={-1}
        >
            <EllipsisIcon modifiers={["sized", "light", "vertical"]} />
        </button>
    );
});

VideoCellMoreButton.displayName = "VideoCellMoreButton";

VideoCellMoreButton.propTypes = {
    className: PropTypes.string,
    isSubgrid: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default VideoCellMoreButton;
