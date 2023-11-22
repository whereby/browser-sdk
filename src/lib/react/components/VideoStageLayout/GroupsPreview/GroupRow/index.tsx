import styles from "./styles.css";

import { Client } from "../../../helpers/layout";

function GroupRow({
    clients,
    id,
    name,
    joinGroupButton,
}: {
    clients: Client[];
    id: string;
    name: string;
    joinGroupButton: React.ReactNode;
}) {
    const desc = clients
        .filter((c) => !(c.breakoutGroupAssigned === id && c.breakoutGroup !== c.breakoutGroupAssigned))
        .map((c) => c.displayName || "Guest")
        .join(", ");

    return (
        <div className={styles.GroupRow}>
            <div className={styles.group}>
                <div className={styles.name}>{name}</div>
                <div className={styles.desc}>{desc}</div>
            </div>
            {joinGroupButton}
        </div>
    );
}

export default GroupRow;
