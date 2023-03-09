import React, { useState } from "react";

export default function DisplayNameForm({
    initialDisplayName,
    onSetDisplayName,
}: {
    initialDisplayName?: string;
    onSetDisplayName: (displayName: string) => void;
}) {
    const [displayName, setDisplayName] = useState(initialDisplayName || "");

    return (
        <div>
            <label htmlFor="displayName">Display name: </label>
            <input
                type="text"
                name="displayName"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
            />
            <button onClick={() => onSetDisplayName(displayName || "")}>Save</button>
        </div>
    );
}
