import styles from "./styles.css";

function GroupCell({
    avatarSize,
    cells,
    count,
    name,
    style,
    joinGroupButton,
}: {
    avatarSize: number;
    cells: React.ReactNode[];
    count: number;
    isLocalClientAssigned: boolean;
    isLocalClientGroup: boolean;
    name: string;
    onJoinClick: () => void;
    style: React.CSSProperties;
    joinGroupButton: React.ReactNode;
}) {
    const need = (cells.length - count) * -1;
    if (need > 0) {
        cells.push(
            [...Array(need)].map((_, index) => (
                <div
                    key={`slot-${index}`}
                    className={styles.avatar}
                    style={{ width: avatarSize, height: avatarSize }}
                />
            ))
        );
    }
    return (
        <div style={style}>
            <div className={styles.cellWrapper}>
                <div className={styles.avatarWrapper}>{cells}</div>
                <div className={styles.navWrapper}>
                    <div className={styles.name}>{name}</div>
                    {joinGroupButton}
                </div>
            </div>
        </div>
    );
}

export default GroupCell;
