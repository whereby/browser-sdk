import PropTypes from "prop-types";
import cn from "classnames";
import { BackIcon } from "react-components";
import { Localized } from "@fluent/react/compat";

import styles from "./styles.css";

function SelfviewVisibilityToggle({
    className,
    isHiddenSelfview,
    onClick,
}: {
    className: string;
    isHiddenSelfview: boolean;
    onClick: () => void;
}) {
    return (
        <div
            className={cn(styles.SelfviewVisibilityToggle, className, {
                [styles.isSelfviewVisible]: !isHiddenSelfview,
            })}
        >
            <Localized
                id={"SelfviewVisibilityToggle-button-label"}
                attrs={{ "aria-label": true }}
                $kind={isHiddenSelfview ? "show" : "hide"}
            >
                <button
                    aria-label={isHiddenSelfview ? "Show self view" : "Hide self view"}
                    className={styles.arrowButton}
                    onClick={onClick}
                    type={"button"}
                >
                    <BackIcon
                        modifiers={["sized"]}
                        className={cn({
                            [styles.hideButtonIcon]: !isHiddenSelfview,
                        })}
                    />
                </button>
            </Localized>
        </div>
    );
}

SelfviewVisibilityToggle.propTypes = {
    className: PropTypes.string,
    isHiddenSelfview: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default SelfviewVisibilityToggle;
