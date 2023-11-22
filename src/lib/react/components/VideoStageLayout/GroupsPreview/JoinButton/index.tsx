function JoinButton({
    isLocalClientAssigned,
    isLocalClientGroup,
    onClick,
    variant = "default",
    primaryButton: PrimaryButton,
    buttonText,
    enterGroupButtonText,
    switchGroupButtonText,
}: {
    primaryButton: React.JSXElementConstructor<{ onClick: () => void; children: React.ReactNode }>;
    isLocalClientAssigned: boolean;
    isLocalClientGroup: boolean;
    onClick: () => void;
    variant: string;
    buttonText: React.ReactNode;
    enterGroupButtonText: React.ReactNode;
    switchGroupButtonText: React.ReactNode;
}) {
    const buttonModifiers = ["small"];
    const isEnterGroup = isLocalClientAssigned && isLocalClientGroup;
    const isSwitchGroup = isLocalClientAssigned && !isLocalClientGroup;

    if (variant === "constrained") {
        buttonModifiers.push("invisible");
    }
    if (isLocalClientGroup) {
        buttonModifiers.push("secondary");
    }

    if (isEnterGroup) {
        buttonText = enterGroupButtonText;
    } else if (isSwitchGroup) {
        buttonText = switchGroupButtonText;
    }

    return <PrimaryButton onClick={onClick}>{buttonText}</PrimaryButton>;
}

export default JoinButton;
