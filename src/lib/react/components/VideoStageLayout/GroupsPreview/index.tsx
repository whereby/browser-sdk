import cn from "classnames";

import GroupRow from "./GroupRow";
import GroupCell from "./GroupCell";

import styles from "./styles.css";

import { Bounds, Client } from "../../helpers/layout";

function GroupsPreview({
    avatarSize,
    cellLayout,
    doBreakoutJoin,
    groupedClients = [],
    isConstrained = false,
    localClient,
    style = {},
    groupMemberComponent: GroupMemberComponent,
    joinGroupButton,
}: {
    groupMemberComponent: React.JSXElementConstructor<{ client: Client }>;
    avatarSize: number;
    doBreakoutJoin: (id: string) => void;
    cellLayout?: { cols: number; rows: number; bounds: Bounds };
    groupedClients?: { clients: Client[]; group: { id: string; name: string } }[];
    isConstrained?: boolean;
    localClient: Client;
    style?: React.CSSProperties;
    joinGroupButton: React.ReactNode;
}) {
    const { breakoutGroupAssigned } = localClient;
    if (isConstrained) {
        groupedClients = [...groupedClients].sort((a, b) =>
            a.group.id === breakoutGroupAssigned ? -1 : b.group.id === breakoutGroupAssigned ? 1 : 0
        );
    }
    return (
        <div
            className={cn(styles.GroupsPreview, {
                [styles.gridWrapper]: !isConstrained,
                [styles.tableWrapper]: isConstrained,
            })}
            style={style}
        >
            <div className={cn({ [styles.grid]: !isConstrained, [styles.table]: isConstrained })}>
                {groupedClients.map(({ group, clients }) => {
                    const baseProps = {
                        clients,
                        id: group.id,
                        isLocalClientAssigned: !!breakoutGroupAssigned,
                        isLocalClientGroup: breakoutGroupAssigned === group.id,
                        key: `group-${group.id}`,
                        name: group.name,
                        onJoinClick: () => doBreakoutJoin(group.id),
                        joinGroupButton,
                    };
                    return isConstrained ? (
                        <GroupRow {...baseProps} />
                    ) : (
                        cellLayout && (
                            <GroupCell
                                avatarSize={avatarSize}
                                count={cellLayout?.cols ?? 0 * cellLayout?.rows ?? 0} // fully fill out the grid
                                style={{ width: Math.round(cellLayout.bounds.width) }}
                                cells={clients.map((c) => (
                                    <GroupMemberComponent client={c} key={c.id} />
                                ))}
                                {...baseProps}
                            />
                        )
                    );
                })}
            </div>
        </div>
    );
}

export default GroupsPreview;
