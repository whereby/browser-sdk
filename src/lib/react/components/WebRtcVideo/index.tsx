import { useState, cloneElement, useReducer, useRef, useMemo, useEffect, useCallback, memo } from "react";
import PropTypes from "prop-types";
import cn from "classnames";
import { connect as connectSelectors } from "redux-bundler-react";
import { Localized } from "@fluent/react/compat";

import {
    MaximizeOffIcon,
    MaximizeOnIcon,
    MotionIcon,
    PopInIcon,
    PopOutIcon,
    SpotlightIcon,
    CrispIcon,
} from "react-components";

import styles from "./styles.css";

import AudioIndicator from "./AudioIndicator";
import WebRtcVideoUi from "./ui";
import MediaPortal, { createPortalTarget } from "./MediaPortal";
import ContextualMenu from "./ContextualMenu";
import MenuBar from "./MenuBar";
import { action, reducer, initialState } from "./duck";

import ParticipantMenu from "../ParticipantMenu";
import { shouldShowReaction } from "../ReactionsOverlay";

import ClientStats from "../../components/ClientStats";
import BackgroundEffectsIcon from "../../components/icons/BackgroundEffectsIcon";

import { boxPropType, makeBox } from "../../helpers/layout";
import getAudioContext from "../../helpers/audioContextWrapper";
import { canSwitchSpeaker } from "../../helpers/mediaElementSupport";

export function areWebRtcVideoPropsEqual(prevProps, nextProps) {
    const { recentChatMessagesByClientId: nextRecentChatMessagesByClientId, ...restNextProps } = nextProps;
    const { recentChatMessagesByClientId: prevRecentChatMessagesByClientId, ...restPrevProps } = prevProps;
    // do shallow equality comparison for all other props than recentChatMessagesByClientId
    if (Object.entries(restNextProps).some(([key, value]) => restPrevProps[key] !== value)) {
        return false;
    }
    // there is a new chat message made by this clientId
    if (
        nextRecentChatMessagesByClientId[nextProps.client.id]?.id !==
        prevRecentChatMessagesByClientId[prevProps.client.id]?.id
    ) {
        return false;
    }
    // no changes, skip render
    return true;
}

const FloatingMenu = ({
    canApplyEffects,
    canFloat,
    canMaximize,
    canSpotlight,
    client,
    contextualMenu,
    doPref,
    doRemoveClientSpotlight,
    doSpotlightClient,
    featureScreenshareQualityOn,
    hideLabels,
    isFloating,
    isFullscreen,
    isMaximized,
    isScreenshare,
    isSpotlighted,
    onClickEffects,
    onToggleFloat,
    onToggleMaximize,
    prefScreenshareQuality,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleIsOpen = () => setIsOpen((prev) => !prev);
    const menu = contextualMenu ? cloneElement(contextualMenu, { onClick: toggleIsOpen }) : null;
    const onToggleSpotlight = () => {
        if (!!client.isSpotlighted) {
            doRemoveClientSpotlight({ id: client.id });
        } else {
            doSpotlightClient({ id: client.id });
        }
    };
    const items = [];

    // Local client
    if (canFloat && !isFullscreen && !isMaximized && !isScreenshare && !isSpotlighted) {
        items.push(
            isFloating ? (
                <MenuBar.Item key={"popIn"} hideLabel={hideLabels} icon={<PopInIcon />} onClick={onToggleFloat}>
                    <Localized id={"InCallParticipantFrame-float-exit"}>Move to grid</Localized>
                </MenuBar.Item>
            ) : (
                <MenuBar.Item key={"popOut"} hideLabel={hideLabels} icon={<PopOutIcon />} onClick={onToggleFloat}>
                    <Localized id={"InCallParticipantFrame-float"}>Pop out</Localized>
                </MenuBar.Item>
            )
        );
    }

    // Screenshare
    if (featureScreenshareQualityOn && client.isLocalClient && client.isPresentation && !isFloating) {
        if (prefScreenshareQuality === "detail") {
            items.push(
                <MenuBar.Item
                    key={"screenshareQualityMotion"}
                    hideLabel={hideLabels}
                    icon={<MotionIcon />}
                    onClick={() => doPref("screenshareQuality", "motion")}
                >
                    <Localized id={"InCallParticipantFrame-optimize-motion"}>Optimize for motion</Localized>
                </MenuBar.Item>
            );
        } else {
            items.push(
                <MenuBar.Item
                    key={"screenshareQualityDetail"}
                    hideLabel={hideLabels}
                    icon={<CrispIcon />}
                    onClick={() => doPref("screenshareQuality", "detail")}
                >
                    <Localized id={"InCallParticipantFrame-optimize-detail"}>Optimize for detail</Localized>
                </MenuBar.Item>
            );
        }
    }

    if (canSpotlight && !isFloating) {
        items.push(
            isSpotlighted ? (
                <MenuBar.Item
                    key={"spotlightOff"}
                    hideLabel={hideLabels}
                    icon={<SpotlightIcon />}
                    onClick={onToggleSpotlight}
                >
                    <Localized id={"InCallParticipantFrame-spotlight-off-short"}>Spotlight off</Localized>
                </MenuBar.Item>
            ) : (
                <MenuBar.Item
                    key={"spotlight"}
                    hideLabel={hideLabels}
                    icon={<SpotlightIcon />}
                    onClick={onToggleSpotlight}
                >
                    <Localized id={"InCallParticipantFrame-spotlight-on"}>Spotlight</Localized>
                </MenuBar.Item>
            )
        );
    }
    // Special case: guests can remove their own spotlight
    else if (client.isLocalClient && !canSpotlight && isSpotlighted) {
        items.push(
            <MenuBar.Item
                key={"spotlightOff"}
                hideLabel={hideLabels}
                icon={<SpotlightIcon />}
                onClick={onToggleSpotlight}
            >
                <Localized id={"InCallParticipantFrame-spotlight-off-short"}>Spotlight off</Localized>
            </MenuBar.Item>
        );
    }

    if (
        !client.isLocalClient &&
        !client.isPresentation &&
        canMaximize &&
        !canSpotlight &&
        !isFullscreen &&
        !isFloating
    ) {
        items.push(
            isMaximized ? (
                <MenuBar.Item
                    key={"minimize"}
                    hideLabel={hideLabels}
                    icon={<MaximizeOffIcon />}
                    onClick={() => onToggleMaximize("menu")}
                >
                    <Localized id={"InCallParticipantFrame-minimize"}>Minimize</Localized>
                </MenuBar.Item>
            ) : (
                <MenuBar.Item
                    key={"maximize"}
                    hideLabel={hideLabels}
                    icon={<MaximizeOnIcon />}
                    onClick={() => onToggleMaximize("menu")}
                >
                    <Localized id={"InCallParticipantFrame-maximize"}>Maximize</Localized>
                </MenuBar.Item>
            )
        );
    }

    if (canApplyEffects && client.isLocalClient && !isScreenshare && !isFloating && !canSpotlight) {
        items.push(
            <MenuBar.Item
                key={"effects"}
                hideLabel={hideLabels}
                icon={<BackgroundEffectsIcon />}
                onClick={onClickEffects}
            >
                <Localized id={"InCallParticipantFrame-effects"}>Effects</Localized>
            </MenuBar.Item>
        );
    }

    return (
        <MenuBar className={cn({ [styles["floatingMenu--hidden"]]: isOpen })}>
            {items}
            {items.length > 0 && menu ? <MenuBar.Separator /> : null}
            {menu && (
                <ContextualMenu
                    padding={-32}
                    isOpen={isOpen}
                    content={menu}
                    onClickOutside={toggleIsOpen}
                    triggerButton={
                        <MenuBar.MoreButton onClick={toggleIsOpen} aria-haspopup={"menu"}>
                            <Localized id={"InCallParticipantFrame-more"}>More</Localized>
                        </MenuBar.MoreButton>
                    }
                />
            )}
        </MenuBar>
    );
};

FloatingMenu.propTypes = {
    canApplyEffects: PropTypes.bool,
    canFloat: PropTypes.bool,
    canMaximize: PropTypes.bool,
    canSpotlight: PropTypes.bool,
    client: PropTypes.object.isRequired,
    contextualMenu: PropTypes.node,
    doPref: PropTypes.func,
    doRemoveClientSpotlight: PropTypes.func,
    doSpotlightClient: PropTypes.func,
    featureScreenshareQualityOn: PropTypes.bool,
    hideLabels: PropTypes.bool,
    isFloating: PropTypes.bool,
    isFullscreen: PropTypes.bool,
    isMaximized: PropTypes.bool,
    isScreenshare: PropTypes.bool,
    isSpotlighted: PropTypes.bool,
    onClickEffects: PropTypes.func,
    onToggleFloat: PropTypes.func,
    onToggleMaximize: PropTypes.func,
    prefScreenshareQuality: PropTypes.oneOf(["detail", "motion", "text"]),
};

const WebRtcVideo = ({
    aspectRatio,
    avatarSize,
    canFloat: givenCanFloat,
    canFullscreen,
    canSpotlight,
    canZoom,
    cellPaddings = makeBox(),
    className,
    client,
    coLocationGroupColors,
    coLocationIsInGroupWithLoudSpeaker,
    connectionMonitorClientIdsWithProblems,
    contentWidth,
    doEnterFullscreenMode,
    doLocalClientSetStickyReaction,
    doPref,
    doRemoveClientSpotlight,
    doSelfviewHiddenAnalytics,
    doSetActiveSettingsDialogPane,
    doSetClientAspectRatio,
    doSetLocalDisplayName,
    doSetMaximizedClient,
    doSpotlightClient,
    doSwitchNextCamera,
    doUnsetMaximizedClient,
    featureBrandAvatarsOn,
    featureOnlyRefreshSelfviewOn,
    featureScreenshareQualityOn,
    featureVolumeMuteOn,
    floatingClientView,
    fullscreenClientView,
    isChatOpen,
    isDisplayNameForced,
    isDraggable,
    isLocalStreamSwitching,
    isPhoneResolution,
    isPip,
    isPlaceholder,
    isSmallCell,
    isSubgrid,
    isTouchDevice,
    isWindowFocused,
    isZoomedByDefault,
    localClientAudioHasBeenResumed,
    localClientIsRecorder,
    localDevices = [],
    localScreenshareSource,
    maximizedClientView,
    prefs,
    preferSpeakerId,
    prefScreenshareQuality,
    recentChatMessagesByClientId,
    shouldShowCameraEffects,
    shouldShowQualityIndicators,
    stats,
    statsIsRunning,
    withRoundedCorners,
    withShadow,
}) => {
    const [state, dispatch] = useReducer(reducer, initialState, () => ({
        ...initialState,
        mediaPortalTarget: createPortalTarget(),
    }));
    const audioElementRef = useRef(null);
    const videoElementRef = useRef(null);

    const [isVideoLoaded, setVideoLoaded] = useState(false);

    // useMemos
    const isAudioMuted = useMemo(() => isPlaceholder || !client.isAudioEnabled, [isPlaceholder, client.isAudioEnabled]);

    const isVideoMuted = useMemo(() => isPlaceholder || !client.isVideoEnabled, [isPlaceholder, client.isVideoEnabled]);

    const isLocalClient = useMemo(() => Boolean(client.isLocalClient), [client.isLocalClient]);

    const recentChatMessage = useMemo(
        () => recentChatMessagesByClientId[client.id],
        [recentChatMessagesByClientId, client.id]
    );

    let clientStats = null;
    if (statsIsRunning) {
        clientStats = { ...stats[client.id] };
        if (client.isLocalClient && !client.isPresentation) {
            clientStats.aggregated = stats.aggregated;
        }
    }

    const canSwitch = useMemo(() => {
        return Boolean(
            isLocalClient &&
                localDevices.filter((d) => d.kind === "videoinput").length > 1 &&
                (isPhoneResolution || isTouchDevice)
        );
    }, [isLocalClient, localDevices, isPhoneResolution, isTouchDevice]);

    const isMaximized = useMemo(
        () => Boolean(maximizedClientView && maximizedClientView.id === client.id),
        [maximizedClientView, client.id]
    );

    const isFullscreen = useMemo(
        () => Boolean(fullscreenClientView && fullscreenClientView.id === client.id),
        [fullscreenClientView, client.id]
    );

    const isFloating = useMemo(() => floatingClientView?.id === client.id, [floatingClientView, client.id]);

    const isScreenshare = useMemo(() => Boolean(client.isPresentation), [client.isPresentation]);

    const isZoomed = useMemo(
        () => (state.isZoomed === null ? Boolean(isZoomedByDefault) : state.isZoomed),
        [state.isZoomed, isZoomedByDefault]
    );

    const audioStream = useMemo(() => client.audioOnlyStream || client.stream, [client.audioOnlyStream, client.stream]);

    const canFloat = useMemo(
        () => givenCanFloat && isLocalClient && !isScreenshare,
        [givenCanFloat, isLocalClient, isScreenshare]
    );

    const isSpotlighted = useMemo(() => Boolean(client.isSpotlighted), [client.isSpotlighted]);

    const isMutedLocally = useMemo(() => client.localVolume === 0, [client.localVolume]);

    const clientConnectionState = useMemo(
        () =>
            (shouldShowQualityIndicators &&
                !(isVideoMuted && isAudioMuted) &&
                connectionMonitorClientIdsWithProblems.find((c) => c.clientId === client.id)?.connectionState) ||
            undefined,
        [connectionMonitorClientIdsWithProblems, client.id, isAudioMuted, isVideoMuted, shouldShowQualityIndicators]
    );

    // Effects
    useEffect(() => {
        // new code will only refresh selfview when switching localstream (changing camera or toggling effects)
        if (featureOnlyRefreshSelfviewOn) {
            if (!isLocalClient) return;
            const switchingStateIsChanged = isLocalStreamSwitching !== state.isSwitching;
            const videoMuteStateIsChanged = isVideoMuted !== state.isVideoMuted;
            if (!switchingStateIsChanged && !videoMuteStateIsChanged) return;

            // needs to refresh selfview video when switching stream or unmuting to workaround freezed camera
            const needsRefresh =
                (switchingStateIsChanged && !isLocalStreamSwitching) || (videoMuteStateIsChanged && !isVideoMuted);

            if (needsRefresh) {
                try {
                    videoElementRef?.current?.refreshStream();
                } catch {}
            }
            if (switchingStateIsChanged) dispatch(action.localMediaSwitching(Boolean(isLocalStreamSwitching)));
            if (videoMuteStateIsChanged) dispatch(action.updateVideoMute(Boolean(isVideoMuted)));
            return;
        }
        // old code would refresh all videos when switching localstream (changing camera or toggling effects)
        if (isLocalStreamSwitching !== state.isSwitching || !isVideoMuted) {
            // work around browser bugs leaving stuck camera when switching streams or unmuting
            if (!isLocalStreamSwitching || !isVideoMuted) {
                videoElementRef?.current?.refreshStream();
            }
            dispatch(action.localMediaSwitching(Boolean(isLocalStreamSwitching)));
        }
    }, [
        isLocalStreamSwitching,
        state.isSwitching,
        isVideoMuted,
        state.isVideoMuted,
        isLocalClient,
        featureOnlyRefreshSelfviewOn,
    ]);

    const hasSpeakerSelectionSupport = canSwitchSpeaker();
    useEffect(() => {
        if (!hasSpeakerSelectionSupport) return;

        if (preferSpeakerId && audioElementRef.current && audioStream)
            audioElementRef.current.setSinkId(preferSpeakerId);
    }, [preferSpeakerId, audioStream, hasSpeakerSelectionSupport]);

    useEffect(() => {
        const resumeAudio = async () => {
            const { audioContext } = getAudioContext();
            if (audioContext?.state === "suspended") {
                await audioContext.resume();
            }
        };
        if (localClientAudioHasBeenResumed && audioElementRef.current) {
            audioElementRef.current.play();
            resumeAudio();
        }
    }, [localClientAudioHasBeenResumed]);

    // Callbacks
    const handleVideoLoaded = useCallback(() => {
        dispatch(action.videoLoaded());
        setVideoLoaded(true);
    }, []);

    const handleVideoResized = useCallback(() => {
        const ar = videoElementRef.current && videoElementRef.current.captureAspectRatio();
        if (ar !== aspectRatio && doSetClientAspectRatio) {
            doSetClientAspectRatio({ aspectRatio: ar, id: client.id });
        }
    }, [aspectRatio, doSetClientAspectRatio, client.id]);

    const handleSwitch = useCallback(() => {
        if (canSwitch && !state.isSwitching) doSwitchNextCamera();
    }, [canSwitch, state.isSwitching, doSwitchNextCamera]);

    const toggleFloat = useCallback(() => {
        if (isLocalClient) doPref("floatSelf", !prefs.floatSelf);
    }, [isLocalClient, doPref, prefs.floatSelf]);

    const toggleMaximize = useCallback(
        (source) => {
            const type = isScreenshare ? "screenshare" : isLocalClient ? "local" : "remote";
            if (isMaximized) return doUnsetMaximizedClient({ source, type });
            return doSetMaximizedClient({
                id: client.id,
                source,
                type,
            });
        },
        [isMaximized, doUnsetMaximizedClient, doSetMaximizedClient, client.id, isScreenshare, isLocalClient]
    );

    const toggleSpotlight = useCallback(() => {
        if (!canSpotlight) return;
        if (client.isSpotlighted) return doRemoveClientSpotlight({ id: client.id });
        return doSpotlightClient({ id: client.id });
    }, [canSpotlight, client.isSpotlighted, doRemoveClientSpotlight, client.id, doSpotlightClient]);

    const handleDoubleClick = useCallback(
        (e) => {
            // Avoid double click functionality when the event is fired
            // on inputs like the one used for the display name
            if (e.target.tagName === "INPUT") return;
            if (isPhoneResolution || isFullscreen) return;
            if (isPip) return;
            if (isFloating) return toggleFloat();
            if (e.shiftKey) return toggleSpotlight();
            return toggleMaximize("double-click");
        },
        [isPhoneResolution, isPip, isFullscreen, isFloating, toggleFloat, toggleSpotlight, toggleMaximize]
    );
    const toggleFullscreen = useCallback(() => {
        if (isFullscreen) return doEnterFullscreenMode(null);
        return doEnterFullscreenMode(client.id);
    }, [isFullscreen, doEnterFullscreenMode, client.id]);

    const toggleZoomState = useCallback(() => {
        dispatch(action.updateIsZoomed(isZoomedByDefault));
    }, [isZoomedByDefault]);

    const audioIndicator = isPlaceholder ? null : (
        <AudioIndicator
            avatarSize={avatarSize}
            isMuted={!client.isAudioEnabled || isMutedLocally}
            stream={audioStream}
        />
    );
    const shouldShowFloatingMenu = !isTouchDevice && contentWidth > 160 && !isPip;
    const contextualMenuContent = (
        <ParticipantMenu
            canApplyEffects={
                shouldShowFloatingMenu
                    ? shouldShowCameraEffects &&
                      !(client.isLocalClient && !isScreenshare && !isFloating && !canSpotlight)
                    : shouldShowCameraEffects
            }
            canFloat={
                shouldShowFloatingMenu
                    ? canFloat && !(!isFullscreen && !isMaximized && !isScreenshare && !isSpotlighted)
                    : canFloat
            }
            canFullscreen={canFullscreen}
            canMaximize={
                shouldShowFloatingMenu
                    ? !(!isLocalClient && !client.isPresentation && !isFullscreen && !isFloating && !canSpotlight)
                    : true
            }
            canSwitch={canSwitch}
            canZoom={canZoom}
            client={client}
            hideSpotlight={
                shouldShowFloatingMenu
                    ? (canSpotlight && !isFloating) || (isLocalClient && !canSpotlight && isSpotlighted)
                    : false
            }
            isFloating={isFloating}
            isFullscreen={isFullscreen}
            isMaximized={isMaximized}
            isPlaceholder={isPlaceholder}
            isZoomed={isZoomed}
            onSwitch={handleSwitch}
            onToggleFloat={toggleFloat}
            onToggleFullscreen={toggleFullscreen}
            onToggleMaximize={toggleMaximize}
            onToggleZoomState={toggleZoomState}
            withHeader={!isFloating && !isScreenshare}
        />
    );
    const floatingMenu = shouldShowFloatingMenu ? (
        <FloatingMenu
            canApplyEffects={shouldShowCameraEffects}
            canFloat={canFloat}
            canMaximize
            canSpotlight={canSpotlight}
            client={client}
            contextualMenu={contextualMenuContent}
            doPref={doPref}
            doRemoveClientSpotlight={doRemoveClientSpotlight}
            doSpotlightClient={doSpotlightClient}
            featureScreenshareQualityOn={featureScreenshareQualityOn}
            hideLabels={contentWidth < 420}
            isFloating={isFloating}
            isFullscreen={isFullscreen}
            isMaximized={isMaximized}
            isScreenshare={isScreenshare}
            isSpotlighted={isSpotlighted}
            onClickEffects={() => doSetActiveSettingsDialogPane("effects")}
            onToggleFloat={toggleFloat}
            onToggleMaximize={toggleMaximize}
            prefScreenshareQuality={prefScreenshareQuality}
        />
    ) : null;

    return (
        <>
            <WebRtcVideoUi
                audioIndicator={audioIndicator}
                avatarSize={avatarSize}
                avatarUrl={client.avatarUrl}
                canSwitch={canSwitch}
                canZoom={canZoom}
                cellPaddings={cellPaddings}
                className={className}
                clientConnectionState={clientConnectionState}
                clientConnectionStatus={client.connectionStatus}
                clientId={client.id}
                clientStats={clientStats ? <ClientStats {...clientStats} /> : undefined}
                contentWidth={contentWidth}
                contextualMenuContent={contextualMenuContent}
                coLocationGroup={client.coLocationGroup}
                coLocationGroupColors={coLocationGroupColors}
                displayName={client.displayName}
                doSelfviewHiddenAnalytics={doSelfviewHiddenAnalytics}
                featureBrandAvatarsOn={featureBrandAvatarsOn}
                floatingMenu={floatingMenu}
                isAudioMuted={isAudioMuted}
                isDisplayNameForced={isDisplayNameForced}
                isDraggable={isDraggable}
                isFloating={isFloating}
                isFullscreen={isFullscreen}
                isLocalClient={isLocalClient}
                isMutedLocally={isMutedLocally}
                isPip={isPip}
                isPlaceholder={isPlaceholder}
                isRecording={Boolean(client.isRecording)}
                isScreenshare={isScreenshare}
                isSelfieCam={Boolean(client.isSelfieCam)}
                isSmallCell={isSmallCell}
                isSpotlighted={isSpotlighted}
                isStreaming={Boolean(client.isStreaming)}
                isSubgrid={isSubgrid}
                isVideoLoaded={isVideoLoaded}
                isVideoMuted={isVideoMuted}
                isVideoSwitching={state.isSwitching}
                isZoomed={isZoomed}
                key={`ui-${client.id}`}
                localClientIsRecorder={localClientIsRecorder}
                mediaContentNode={state.mediaPortalTarget}
                onClearStickyReaction={() => doLocalClientSetStickyReaction(null)}
                onDoubleClick={handleDoubleClick}
                onSetLocalDisplayName={doSetLocalDisplayName}
                onSwitch={handleSwitch}
                prefs={prefs}
                recentChatMessage={recentChatMessage}
                shouldShowReaction={shouldShowReaction({
                    recentChatMessage,
                    isChatOpen,
                })}
                stickyReaction={client.stickyReaction}
                withRoundedCorners={withRoundedCorners}
                withShadow={withShadow}
            />
            <MediaPortal
                audioElementRef={audioElementRef}
                videoElementRef={videoElementRef}
                audioStream={isPlaceholder ? null : audioStream}
                client={client}
                featureVolumeMuteOn={featureVolumeMuteOn}
                handleVideoLoaded={handleVideoLoaded}
                handleVideoResized={handleVideoResized}
                key={`media-${client.id}`}
                prefs={prefs}
                target={state.mediaPortalTarget}
                isInCoLocationGroupWithLoudSpeaker={coLocationIsInGroupWithLoudSpeaker}
                isWindowFocused={isWindowFocused}
                localScreenshareSource={localScreenshareSource}
                withRoundedCorners={withRoundedCorners}
            />
        </>
    );
};

WebRtcVideo.propTypes = {
    aspectRatio: PropTypes.number,
    avatarSize: PropTypes.number,
    canFloat: PropTypes.bool.isRequired,
    canFullscreen: PropTypes.bool.isRequired,
    canSpotlight: PropTypes.bool.isRequired,
    canZoom: PropTypes.bool.isRequired,
    cellPaddings: boxPropType,
    className: PropTypes.string,
    client: PropTypes.object.isRequired,
    coLocationGroupColors: PropTypes.object,
    coLocationIsInGroupWithLoudSpeaker: PropTypes.bool,
    connectionMonitorClientIdsWithProblems: PropTypes.array,
    contentWidth: PropTypes.number,
    doEnterFullscreenMode: PropTypes.func.isRequired,
    doLocalClientSetStickyReaction: PropTypes.func.isRequired,
    doPref: PropTypes.func,
    doRemoveClientSpotlight: PropTypes.func.isRequired,
    doSelfviewHiddenAnalytics: PropTypes.func.isRequired,
    doSetActiveSettingsDialogPane: PropTypes.func.isRequired,
    doSetClientAspectRatio: PropTypes.func,
    doSetLocalDisplayName: PropTypes.func.isRequired,
    doSetMaximizedClient: PropTypes.func.isRequired,
    doSetNotification: PropTypes.func.isRequired,
    doSpotlightClient: PropTypes.func.isRequired,
    doSwitchNextCamera: PropTypes.func.isRequired,
    doUnsetMaximizedClient: PropTypes.func.isRequired,
    featureBrandAvatarsOn: PropTypes.bool,
    featureOnlyRefreshSelfviewOn: PropTypes.bool,
    featureScreenshareQualityOn: PropTypes.bool,
    featureVolumeMuteOn: PropTypes.bool,
    floatingClientView: PropTypes.object,
    fullscreenClientView: PropTypes.object,
    isChatOpen: PropTypes.bool.isRequired,
    isDisplayNameForced: PropTypes.bool,
    isDraggable: PropTypes.bool,
    isLocalStreamSwitching: PropTypes.bool,
    isPhoneResolution: PropTypes.bool.isRequired,
    isPip: PropTypes.bool,
    isPlaceholder: PropTypes.bool.isRequired,
    isSmallCell: PropTypes.bool,
    isSubgrid: PropTypes.bool,
    isTouchDevice: PropTypes.bool.isRequired,
    isWindowFocused: PropTypes.bool.isRequired,
    isZoomedByDefault: PropTypes.bool,
    localClientAudioHasBeenResumed: PropTypes.bool.isRequired,
    localClientId: PropTypes.string,
    localClientIsRecorder: PropTypes.bool.isRequired,
    localDevices: PropTypes.array,
    localScreenshareSource: PropTypes.string,
    maximizedClientView: PropTypes.object,
    prefScreenshareQuality: PropTypes.oneOf(["detail", "motion", "text"]),
    preferSpeakerId: PropTypes.string,
    prefs: PropTypes.object.isRequired,
    recentChatMessagesByClientId: PropTypes.object.isRequired,
    shouldShowCameraEffects: PropTypes.bool,
    shouldShowQualityIndicators: PropTypes.bool,
    stats: PropTypes.object,
    statsIsRunning: PropTypes.bool,
    withRoundedCorners: PropTypes.bool.isRequired,
    withShadow: PropTypes.bool.isRequired,
};

export { WebRtcVideo };

export default connectSelectors(
    "doEnterFullscreenMode",
    "doLocalClientSetStickyReaction",
    "doPref",
    "doRemoveClientSpotlight",
    "doSelfviewHiddenAnalytics",
    "doSetActiveSettingsDialogPane",
    "doSetLocalDisplayName",
    "doSetMaximizedClient",
    "doSetNotification",
    "doSpotlightClient",
    "doSwitchNextCamera",
    "doUnsetMaximizedClient",
    "selectShouldShowCameraEffects",
    "selectCanFloat",
    "selectCanFullscreen",
    "selectCanSpotlight",
    "selectConnectionMonitorClientIdsWithProblems",
    "selectCoLocationGroupColors",
    "selectCoLocationIsInGroupWithLoudSpeaker",
    "selectFeatureBrandAvatarsOn",
    "selectFeatureOnlyRefreshSelfviewOn",
    "selectFeatureScreenshareQualityOn",
    "selectFeatureVolumeMuteOn",
    "selectFloatingClientView",
    "selectFullscreenClientView",
    "selectIsChatOpen",
    "selectIsDisplayNameForced",
    "selectIsLocalStreamSwitching",
    "selectIsPhoneResolution",
    "selectIsTouchDevice",
    "selectIsWindowFocused",
    "selectLocalClientAudioHasBeenResumed",
    "selectLocalClientId",
    "selectLocalClientIsRecorder",
    "selectLocalDevices",
    "selectLocalScreenshareSource",
    "selectMaximizedClientView",
    "selectPreferSpeakerId",
    "selectPrefs",
    "selectPrefScreenshareQuality",
    "selectRecentChatMessagesByClientId",
    "selectShouldShowQualityIndicators",
    "selectStats",
    "selectStatsIsRunning",
    memo(WebRtcVideo, areWebRtcVideoPropsEqual)
);
