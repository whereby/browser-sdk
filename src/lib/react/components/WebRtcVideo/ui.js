import { useState, useEffect, useLayoutEffect, useCallback, cloneElement } from "react";
import PropTypes from "prop-types";
import cn from "classnames";
import {
    Avatar,
    CrossSmallIcon,
    SpeakerOffIcon,
    SpeakerOnIcon,
    MicOffIcon,
    CameraFlipIcon,
    SparkleIcon,
    SignalIcon,
    CoLocationIcon,
    InlineSpinner,
} from "react-components";
import { Localized } from "@fluent/react/compat";

import styles from "./styles.css";
import subgridStyles from "./subgridStyles.css";
import sharedStyles from "./sharedStyles.css";
import VideoCellMoreButton from "./VideoCellMoreButton";
import SelfviewVisibilityToggle from "./SelfviewVisibilityToggle";
import AvatarShakeWrapper from "./AvatarShakeWrapper";
import ContextualMenu from "./ContextualMenu";

import RaisedHandBadge from "../../components/RaisedHandBadge";
import BrandAvatar from "../../components/BrandAvatar";
import EditableText from "../../components/EditableText";
import { useDoubleClick } from "../../helpers/hooks/useDoubleClick";
import { boxPropType } from "../../helpers/layout";
import { DisplayName } from "../../components/DisplayName";

function VideoMutedIndicator({
    audioIndicator,
    avatarUrl,
    displayName,
    featureBrandAvatarsOn,
    isSmallCell,
    isSpeaking,
    withRoundedCorners,
}) {
    return (
        <div
            className={cn(styles.videoOffIndicator, "jstest-video-muted-avatar", {
                [styles.withRoundedCorners]: withRoundedCorners,
            })}
            data-testid={"WebRtcVideo-videoMutedAvatar"}
        >
            <div className={cn(styles.avatarWrapper, { [styles.isSmallCell]: isSmallCell })}>
                {!!featureBrandAvatarsOn ? (
                    <BrandAvatar
                        modifiers={["square"]}
                        avatarUrl={avatarUrl}
                        name={displayName}
                        size={isSmallCell ? 60 : 80}
                        className={cn(sharedStyles.avatar, {
                            [sharedStyles.isSpeaking]: isSpeaking,
                        })}
                    />
                ) : (
                    <Avatar
                        modifiers={["square"]}
                        avatarUrl={avatarUrl}
                        name={displayName}
                        size={isSmallCell ? 60 : 80}
                        className={cn(sharedStyles.avatar, {
                            [sharedStyles.isSpeaking]: isSpeaking,
                        })}
                    />
                )}
                {audioIndicator}
            </div>
        </div>
    );
}

VideoMutedIndicator.propTypes = {
    audioIndicator: PropTypes.element,
    avatarUrl: PropTypes.string,
    displayName: PropTypes.string,
    featureBrandAvatarsOn: PropTypes.bool,
    isSmallCell: PropTypes.bool,
    isSpeaking: PropTypes.bool,
    withRoundedCorners: PropTypes.bool,
};

function QualityIndicator({ connectionState = "congested", size }) {
    return (
        <Localized id={"InCallControls-quality-indicator"} attrs={{ "aria-label": true, title: true }}>
            <div
                className={cn(styles.signalIcon, {
                    [styles["signalIcon--small"]]: size === "small",
                    [styles[`signalIcon--congested`]]: connectionState === "congested",
                    [styles[`signalIcon--lossy`]]: connectionState === "lossy",
                })}
                title={"Poor connection"}
                aria-label={"Poor connection"}
            >
                <SignalIcon modifiers={["sizedSmall", "light"]} aria-hidden={"true"} />
            </div>
        </Localized>
    );
}

QualityIndicator.propTypes = {
    connectionState: PropTypes.oneOf(["congested", "lossy"]),
    size: PropTypes.oneOf(["small"]),
};

function Controls({
    canSwitch,
    clientConnectionState,
    coLocationGroup,
    onSwitch,
    isDisplayNameForced,
    isLocalClient,
    isMuted,
    isMutedLocally,
    isScreenshare,
    isSpotlighted,
    name,
    onNameChange,
    stickyReaction,
}) {
    const [screenshareLabelDelay, setScreenshareLabelDelay] = useState(true);

    const namePlaceholder = isLocalClient ? "Guest (you)" : "Guest";
    const editableText = (
        <EditableText
            confirmBtnClassName={styles.nameChangeConfirmBtn}
            displayValue={
                name ? (
                    <span>
                        <DisplayName isLocalClient>{name}</DisplayName>
                    </span>
                ) : null
            }
            onEdit={onNameChange}
            placeholder={namePlaceholder}
            value={name}
            withButton
        />
    );

    const nameEle = isLocalClient && !isDisplayNameForced ? editableText : name || namePlaceholder;

    useEffect(() => {
        if (!isScreenshare) return;

        const timer = setTimeout(() => setScreenshareLabelDelay(false), 5000);
        return () => clearTimeout(timer);
    }, [isScreenshare]);

    return (
        <div className={styles.controls}>
            <div className={styles.controlsContent}>
                {isMuted && !isMutedLocally && !isScreenshare && (
                    <div className={cn("jstest-mute-icon", styles.muteIcon)}>
                        <MicOffIcon modifiers={["sizedSmall", "light"]} />
                    </div>
                )}
                {isMutedLocally && (
                    <div className={cn(styles.speakerIconWrapper, styles.mutedLocally)}>
                        <SpeakerOffIcon modifiers={["sizedSmall", "light"]} />
                    </div>
                )}
                {isScreenshare && !isMutedLocally && !isMuted && (
                    <div className={cn(styles.speakerIconWrapper, styles.unmutedScreenshare)}>
                        <SpeakerOnIcon modifiers={["sizedSmall", "light"]} />
                    </div>
                )}
                <div
                    className={cn("jstest-displayname", styles.nameBanner, {
                        [styles.isSpotlighted]: isSpotlighted,
                        [styles.isScreenshare]: isScreenshare && !screenshareLabelDelay,
                    })}
                >
                    {isSpotlighted && <SparkleIcon modifiers={["sizedSmall"]} />}
                    {nameEle}
                </div>
                {canSwitch && (
                    <Localized
                        id={"InCallParticipantFrame-switch-camera-video-cell"}
                        attrs={{ title: true, "aria-label": true }}
                    >
                        <button
                            onClick={onSwitch}
                            className={styles.switchButton}
                            data-testid={"WebRtcVideo-switchCamera"}
                            title={"Switch camera"}
                            aria-label={"Switch camera"}
                        >
                            <CameraFlipIcon modifiers={["sizedSmall", "light"]} />
                        </button>
                    </Localized>
                )}
                {clientConnectionState && <QualityIndicator connectionState={clientConnectionState} />}
                {coLocationGroup && (
                    <div
                        className={cn(styles.coLocationIcon, {
                            [styles.isScreenshare]: isScreenshare && !screenshareLabelDelay,
                        })}
                    >
                        <CoLocationIcon modifiers={["sizedSmall", "light"]} />
                    </div>
                )}
                {stickyReaction}
            </div>
        </div>
    );
}

Controls.propTypes = {
    canSwitch: PropTypes.bool,
    clientConnectionState: PropTypes.string,
    coLocationGroup: PropTypes.string,
    isDisplayNameForced: PropTypes.bool,
    isLocalClient: PropTypes.bool,
    isMuted: PropTypes.bool,
    isMutedLocally: PropTypes.bool,
    isScreenshare: PropTypes.bool,
    isSpotlighted: PropTypes.bool,
    name: PropTypes.string,
    onNameChange: PropTypes.func,
    onSwitch: PropTypes.func,
    stickyReaction: PropTypes.node,
};

function WebRtcVideoUi({
    audioIndicator,
    avatarSize,
    avatarUrl,
    canSwitch,
    canZoom,
    cellPaddings,
    className,
    clientConnectionState,
    clientConnectionStatus,
    clientId,
    clientStats,
    coLocationGroup,
    coLocationGroupColors,
    contextualMenuContent,
    displayName,
    doSelfviewHiddenAnalytics,
    featureBrandAvatarsOn,
    floatingMenu,
    isAudioMuted,
    isDisplayNameForced,
    isDraggable,
    isFloating,
    isFullscreen,
    isLocalClient,
    isMutedLocally,
    isPip,
    isPlaceholder,
    isRecording,
    isScreenshare,
    isSelfieCam,
    isSmallCell,
    isSpotlighted,
    isSubgrid,
    isVideoLoaded,
    isVideoMuted,
    isVideoSwitching,
    isZoomed,
    mediaContentNode,
    localClientIsRecorder,
    onClearStickyReaction,
    onDoubleClick,
    onSetLocalDisplayName,
    onSwitch,
    prefs,
    recentChatMessage,
    shouldShowReaction,
    stickyReaction,
    withRoundedCorners,
    withShadow,
}) {
    // When mediaRef changes, move the cached media DOM node to the new container.
    // This way we make sure that React can't re-create the video / audio elements.
    const [mediaRef, setMediaRef] = useState(null);
    useLayoutEffect(() => {
        if (mediaRef && mediaContentNode) {
            mediaRef.appendChild(mediaContentNode);
        }
    }, [mediaRef, mediaContentNode]);

    const [showMenu, setShowMenu] = useState(false);
    const [isHiddenSelfview, setisHiddenSelfview] = useState(false);
    const toggleMenu = useCallback(() => setShowMenu((prev) => !prev), []);
    const participantMenu = contextualMenuContent ? cloneElement(contextualMenuContent, { onClick: toggleMenu }) : null;

    const onMoreButtonClick = useDoubleClick({ onDoubleClick, onClick: toggleMenu });
    const moreButton = (
        <VideoCellMoreButton className={styles.moreButton} isSubgrid={isSubgrid} onClick={onMoreButtonClick} />
    );
    const recIcon = isRecording ? <div className={styles.recIcon} title={"Is recording"} /> : null;

    if (isSubgrid) {
        const style = { width: avatarSize, height: avatarSize };
        const content = (
            <>
                {!isPip && participantMenu && (
                    <ContextualMenu
                        padding={-avatarSize}
                        isOpen={showMenu}
                        content={participantMenu}
                        onClickOutside={toggleMenu}
                        triggerButton={moreButton}
                    />
                )}
                <div
                    className={cn(subgridStyles.overlay, sharedStyles.avatar, {
                        "jstest-mute-icon": isAudioMuted,
                        [sharedStyles.isMutedLocally]: isMutedLocally,
                        [sharedStyles.isPlaceholder]: isPlaceholder,
                        [sharedStyles.isSpeaking]: !isAudioMuted,
                        [sharedStyles.withShadow]: withShadow,
                    })}
                >
                    {isVideoMuted && (
                        <>
                            {!!featureBrandAvatarsOn ? (
                                <BrandAvatar
                                    className={"jstest-video-muted-avatar"}
                                    modifiers={withRoundedCorners ? ["square"] : []}
                                    avatarUrl={avatarUrl}
                                    name={displayName}
                                    size={avatarSize}
                                    data-testid={"WebRtcVideo-videoMutedAvatar"}
                                />
                            ) : (
                                <Avatar
                                    className={"jstest-video-muted-avatar"}
                                    modifiers={withRoundedCorners ? ["square"] : []}
                                    avatarUrl={avatarUrl}
                                    name={displayName}
                                    size={avatarSize}
                                    data-testid={"WebRtcVideo-videoMutedAvatar"}
                                />
                            )}
                        </>
                    )}
                </div>
                <div ref={setMediaRef} className={subgridStyles.mediaWrapper} />
                {audioIndicator}
                {isRecording && <div className={subgridStyles.topControls}>{recIcon}</div>}
                {stickyReaction && (
                    <div
                        className={cn(subgridStyles.stickyReactionWrapper, {
                            [subgridStyles.withRoundedCorners]: withRoundedCorners,
                        })}
                    >
                        <RaisedHandBadge
                            className={subgridStyles.reaction}
                            size={"medium"}
                            reaction={stickyReaction.reaction}
                        />
                    </div>
                )}
            </>
        );

        // A decent heurestic to figure out if we have subgrid label enabled is if bottom margin has room for a label:
        const withDisplayNameLabel = cellPaddings.top !== cellPaddings.bottom;

        return (
            <div
                className={cn(subgridStyles.WebRtcOverflowVideo, className, "jstest-client-video", {
                    "jstest-local-client-video": isLocalClient,
                    [subgridStyles.mirror]: isSelfieCam,
                    [subgridStyles.hiddenContent]: isVideoMuted,
                    [subgridStyles.withRoundedCorners]: withRoundedCorners,
                    [subgridStyles.withShadow]: withShadow,
                    [styles.disablePointerEvents]: localClientIsRecorder,
                })}
                data-clientid={clientId}
                data-testid={`WebRtcOverflowVideo-${clientId}`}
                title={`${displayName}${isRecording ? " (is recording)" : ""}`}
            >
                <div
                    className={subgridStyles.cellLayout}
                    style={{ padding: `${cellPaddings.top}px ${cellPaddings.right}px` }}
                >
                    <div className={subgridStyles.content} style={style}>
                        <AvatarShakeWrapper
                            className={subgridStyles.avatarWrapper}
                            shouldShowReaction={shouldShowReaction}
                            latestMessage={recentChatMessage}
                            style={style}
                        >
                            {content}
                            {clientConnectionState && (
                                <QualityIndicator size={"small"} connectionState={clientConnectionState} />
                            )}
                        </AvatarShakeWrapper>
                    </div>
                    {withDisplayNameLabel && (
                        <div className={subgridStyles.displayNameLabel}>
                            <DisplayName isLocalClient={isLocalClient}>{displayName}</DisplayName>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    const coLocationBorderClass = coLocationGroup ? coLocationGroupColors[coLocationGroup] : null;

    return (
        <div
            className={cn(styles.WebRtcVideo, className, "WebRtcVideo", "jstest-client-video", {
                "jstest-local-client-video": isLocalClient,
                [styles.mirror]: isSelfieCam,
                [styles.switching]: isVideoSwitching,
                [styles.withRoundedCorners]: withRoundedCorners,
                [styles.withShadow]: withShadow,
                [styles.isPlaceholder]: isPlaceholder,
                [styles.isFloating]: isFloating,
                [styles.isHiddenSelfview]: isHiddenSelfview,
                [styles.disablePointerEvents]: localClientIsRecorder,
                [styles.coLocation]: !!coLocationGroup,
                [styles[`coLocation--${coLocationBorderClass}`]]: !!coLocationBorderClass,
                // Note: fixed aspect ratio cells must technically zoom because the container
                // bounds are rounded to the closest pixel and are not perfectly the same
                // aspect ratio always:
                [styles["WebRtcVideo--zoomed"]]: isZoomed || (!canZoom && !isFullscreen),
                [styles["WebRtcVideo--small"]]: isSmallCell,
                [styles["WebRtcVideo--draggable"]]: isDraggable,
            })}
            data-clientid={clientId}
            data-testid={`WebRtcVideo-${clientId}`}
            onDoubleClick={onDoubleClick}
        >
            <div className={styles.content}>
                {isFloating && (
                    <SelfviewVisibilityToggle
                        className={styles.SelfviewVisibilityToggle}
                        isHiddenSelfview={isHiddenSelfview}
                        onClick={() => {
                            doSelfviewHiddenAnalytics(!isHiddenSelfview);
                            setisHiddenSelfview(!isHiddenSelfview);
                        }}
                    />
                )}
                <div ref={setMediaRef} className={styles.mediaWrapper}>
                    {!isVideoLoaded && (
                        <div className={styles.loaderWrapper}>
                            <InlineSpinner className={styles.inlineSpinner} modifiers={["light"]} />
                        </div>
                    )}
                </div>
                {isVideoMuted && (
                    <VideoMutedIndicator
                        audioIndicator={audioIndicator}
                        avatarUrl={avatarUrl}
                        displayName={displayName}
                        featureBrandAvatarsOn={featureBrandAvatarsOn}
                        isSmallCell={isSmallCell}
                        isSpeaking={!isAudioMuted && !isMutedLocally}
                        withRoundedCorners={withRoundedCorners}
                    />
                )}
                {["connection_disconnected", "connection_failed"].includes(clientConnectionStatus) && (
                    <div
                        className={cn(styles.connectionInterrupted, {
                            [styles.withRoundedCorners]: withRoundedCorners,
                            [styles.small]: isSmallCell,
                        })}
                    >
                        <p>
                            <strong>
                                <Localized id={"InCallParticipantFrame-connection-interrupted"}>
                                    Connection interrupted
                                </Localized>
                            </strong>
                        </p>
                        <p>
                            <Localized id={"InCallParticipantFrame-trying-to-reconnect"}>
                                Trying to reconnect...
                            </Localized>
                        </p>
                    </div>
                )}
                {clientStats}
                {isRecording && <div className={styles.topControls}>{recIcon}</div>}
                <Controls
                    canSwitch={canSwitch}
                    clientConnectionState={clientConnectionState}
                    coLocationGroup={coLocationGroup}
                    onSwitch={onSwitch}
                    isDisplayNameForced={isDisplayNameForced}
                    isLocalClient={isLocalClient}
                    isMuted={isAudioMuted}
                    isMutedLocally={isMutedLocally}
                    isScreenshare={isScreenshare}
                    isSpotlighted={isSpotlighted}
                    name={displayName}
                    onNameChange={onSetLocalDisplayName}
                    stickyReaction={
                        stickyReaction && (
                            <>
                                <RaisedHandBadge
                                    className={cn(styles.stickyReaction, {
                                        [styles.isSmallCell]: isSmallCell,
                                    })}
                                    size={isSmallCell ? "medium" : "large"}
                                    reaction={stickyReaction.reaction}
                                />
                                {isLocalClient && !isSmallCell && !prefs.reactionsButton && (
                                    <button
                                        onClick={() => onClearStickyReaction()}
                                        className={styles.removeStickyReaction}
                                    >
                                        <CrossSmallIcon className={styles.cross} modifiers={["sizedSmall"]} />
                                    </button>
                                )}
                            </>
                        )
                    }
                />
                {!isPip &&
                    (floatingMenu ? (
                        <div className={cn(styles.floatingMenu)}>{floatingMenu}</div>
                    ) : (
                        <ContextualMenu
                            padding={isSmallCell ? -34 : -40}
                            isOpen={showMenu}
                            content={participantMenu}
                            onClickOutside={toggleMenu}
                            triggerButton={moreButton}
                        />
                    ))}
            </div>
        </div>
    );
}

WebRtcVideoUi.propTypes = {
    audioIndicator: PropTypes.element,
    avatarSize: PropTypes.number,
    avatarUrl: PropTypes.string,
    canSwitch: PropTypes.bool.isRequired,
    canZoom: PropTypes.bool.isRequired,
    cellPaddings: boxPropType,
    className: PropTypes.string,
    clientConnectionState: PropTypes.string,
    clientConnectionStatus: PropTypes.string,
    clientId: PropTypes.string.isRequired,
    clientStats: PropTypes.element,
    coLocationGroup: PropTypes.string,
    coLocationGroupColors: PropTypes.object,
    contextualMenuContent: PropTypes.element,
    displayName: PropTypes.string,
    doSelfviewHiddenAnalytics: PropTypes.func.isRequired,
    featureBrandAvatarsOn: PropTypes.bool,
    floatingMenu: PropTypes.node,
    isAudioMuted: PropTypes.bool.isRequired,
    isDisplayNameForced: PropTypes.bool.isRequired,
    isDraggable: PropTypes.bool,
    isFloating: PropTypes.bool,
    isFullscreen: PropTypes.bool.isRequired,
    isLocalClient: PropTypes.bool.isRequired,
    isMutedLocally: PropTypes.bool.isRequired,
    isPip: PropTypes.bool.isRequired,
    isPlaceholder: PropTypes.bool.isRequired,
    isRecording: PropTypes.bool.isRequired,
    isScreenshare: PropTypes.bool.isRequired,
    isSelfieCam: PropTypes.bool.isRequired,
    isSmallCell: PropTypes.bool,
    isSpotlighted: PropTypes.bool.isRequired,
    isSubgrid: PropTypes.bool.isRequired,
    isVideoLoaded: PropTypes.bool.isRequired,
    isVideoMuted: PropTypes.bool.isRequired,
    isVideoSwitching: PropTypes.bool.isRequired,
    isZoomed: PropTypes.bool.isRequired,
    localClientIsRecorder: PropTypes.bool.isRequired,
    mediaContentNode: PropTypes.instanceOf(Element).isRequired,
    onClearStickyReaction: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func.isRequired,
    onSetLocalDisplayName: PropTypes.func.isRequired,
    onSwitch: PropTypes.func.isRequired,
    prefs: PropTypes.object,
    recentChatMessage: PropTypes.object,
    shouldShowReaction: PropTypes.bool,
    stickyReaction: PropTypes.object,
    withRoundedCorners: PropTypes.bool.isRequired,
    withShadow: PropTypes.bool.isRequired,
};

export default WebRtcVideoUi;
