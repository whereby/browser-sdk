import cn from "classnames";
import PropTypes from "prop-types";

import styles from "./styles.css";

// Main breakout room stage backdrop and UI
// Renders fixed backdrop outside the grid bounds to simulate a solid header that includes the top bar on top of the grids

export type BreakoutStagePrimaryButtonType = React.JSXElementConstructor<{ onClick: () => void }>;
export type BreakoutStageBroadcastAnnouncementType = React.JSXElementConstructor<{}>;
function BreakoutStage({
    backdropHeight,
    backdropOffset,
    canSpotlight,
    cellCount,
    className,
    isOnStage,
    onGetOffStage,
    onGetOnStage,
    style,
    broadcastAnnouncement: BroadcastAnnouncement,
    primaryButton: PrimaryButton,
}: {
    broadcastAnnouncement: BreakoutStageBroadcastAnnouncementType;
    primaryButton: BreakoutStagePrimaryButtonType;
    backdropHeight: number;
    backdropOffset: number;
    canSpotlight: boolean;
    cellCount: number;
    className?: string;
    isOnStage: boolean;
    onGetOffStage: () => void;
    onGetOnStage: () => void;
    style: React.CSSProperties;
}) {
    return (
        <div className={cn(styles.BreakoutStage, { [styles.isEmpty]: !cellCount }, className)} style={style}>
            <div className={styles.backdrop} style={{ height: backdropHeight, top: backdropOffset * -1 }} />

            {!!cellCount && <BroadcastAnnouncement />}
            <div className={styles.footer}>
                {(canSpotlight || isOnStage) && <PrimaryButton onClick={isOnStage ? onGetOffStage : onGetOnStage} />}
            </div>
        </div>
    );
}

BreakoutStage.propTypes = {
    backdropHeight: PropTypes.number.isRequired,
    backdropOffset: PropTypes.number.isRequired,
    canSpotlight: PropTypes.bool.isRequired,
    cellCount: PropTypes.number.isRequired,
    className: PropTypes.string,
    isOnStage: PropTypes.bool.isRequired,
    onGetOffStage: PropTypes.func.isRequired,
    onGetOnStage: PropTypes.func.isRequired,
    style: PropTypes.object.isRequired,
};

export default BreakoutStage;
