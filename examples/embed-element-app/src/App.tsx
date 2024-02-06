import { useEffect, useRef, useState } from "react";
import "@whereby.com/browser-sdk/embed";
import CIcon from "@coreui/icons-react";
import {
    cilBell,
    cilCalendar,
    cilCaretBottom,
    cilCaretRight,
    cilChartPie,
    cilChatBubble,
    cilCog,
    cilFile,
    cilHome,
    cilList,
    cilNotes,
} from "@coreui/icons";
import "./App.css";

const events = [
    "camera_toggle",
    "chat_toggle",
    "connection_status_change",
    "deny_device_permission",
    "join",
    "leave",
    "microphone_toggle",
    "participant_join",
    "participant_leave",
    "participantupdate",
    "people_toggle",
    "pip_toggle",
    "screenshare_toggle",
];

function App() {
    const roomUrl = "enter your room url here";
    const elmRef = useRef<HTMLIFrameElement>(null);
    const [eventLogEntries, setEventLogEntries] = useState<any[]>([]);
    const [initTime, setInitTime] = useState<number>(0);

    function handleWherebyEvent(event: any) {
        setEventLogEntries((prev) => [...prev, event]);
    }

    useEffect(() => {
        const element = elmRef.current;
        if (element) {
            events.forEach((event) => {
                element.addEventListener(event, handleWherebyEvent);
            });
            setInitTime(Date.now());
        }
        return () => {
            if (element) {
                events.forEach((event) => {
                    element.removeEventListener(event, handleWherebyEvent);
                });
            }
        };
    }, []);

    return (
        <div className="App">
            <div className="LeftSidebar">
                <CIcon icon={cilHome} style={{ width: "1.5rem" }} />
                <CIcon icon={cilBell} style={{ width: "1.5rem" }} />
                <CIcon icon={cilChatBubble} style={{ width: "1.5rem" }} />
                <CIcon icon={cilChartPie} style={{ width: "1.5rem" }} />
                <CIcon icon={cilCog} style={{ width: "1.5rem" }} />
            </div>
            <div className="WherebyEmbed">
                <whereby-embed
                    chat="off"
                    people="off"
                    background="off"
                    // TODO: remove this line when sdk is updated
                    // @ts-ignore
                    minimal="on"
                    room={roomUrl}
                    style={{ width: "100%", height: "100vh" }}
                    // @ts-ignore
                    ref={elmRef}
                />
            </div>
            <div className="RightSidebar">
                <div className="Card">
                    <div className="Card__header">
                        <div className="Card__title">
                            <CIcon icon={cilCalendar} style={{ width: "1rem" }} />
                            <h2>Session schedule</h2>
                        </div>
                        <CIcon icon={cilCaretRight} style={{ width: "1rem" }} />
                    </div>
                </div>
                <div className="Card NoteCard">
                    <div className="Card__header">
                        <div className="Card__title">
                            <CIcon icon={cilNotes} style={{ width: "1rem" }} />
                            <h2>Notes</h2>
                        </div>
                        <CIcon icon={cilCaretBottom} style={{ width: "1rem" }} />
                    </div>
                    <div className="Card__body"></div>
                    <div className="Card__footer">
                        <input type="text" placeholder="Add note here..." />
                        <button>Add</button>
                    </div>
                </div>
                <div className="Card EventLogCard">
                    <div className="Card__header">
                        <div className="Card__title">
                            <CIcon icon={cilFile} style={{ width: "1rem" }} />
                            <h2>Event log</h2>
                        </div>
                        <CIcon icon={cilCaretBottom} style={{ width: "1rem" }} />
                    </div>
                    <div className="Card__body">
                        {eventLogEntries.reverse().map((entry, index) => (
                            <div key={index} className="EventLogCard__entry">
                                <div className="EventLogCard__entry__title">
                                    <div className="EventLogCard__entry__datetime">
                                        {new Date(initTime + entry.timeStamp).toISOString()}
                                    </div>
                                    <div className="EventLogCard__entry__type">{entry.type}</div>
                                </div>
                                <pre className="EventLogCard__entry__data">{JSON.stringify(entry.detail)}</pre>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="Card">
                    <div className="Card__header">
                        <div className="Card__title">
                            <CIcon icon={cilList} style={{ width: "1rem" }} />
                            <h2>Resources</h2>
                        </div>
                        <CIcon icon={cilCaretRight} style={{ width: "1rem" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
