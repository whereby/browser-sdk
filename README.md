# `@whereby.com/browser-sdk`

> This is a pre-release of the v2 version of this library, adding support for more custom integration using React hooks and plain JavaScript classes in addition to the web component for embedding.

Whereby browser SDK is a library for seamless integration of Whereby (https://whereby.com) video calls into your web application.

## Installation

```shell
npm install @whereby.com/browser-sdk
```

or

```shell
yarn add @whereby.com/browser-sdk
```

## Usage

> In order to make use of this functionality, you must have a Whereby account from which you can create room urls, either [manually or through our API](https://docs.whereby.com/creating-and-deleting-rooms).

### React hooks

#### useLocalMedia

The `useLocalMedia` hook enables preview and selection of local devices (camera & microphone) prior to establishing a connection within a Whereby room. Use this hook to build rich pre-call
experiences, allowing end users to confirm their device selection up-front. This hook works seamlessly with the `useRoomConnection` hook described below.

```js
import { useLocalMedia, VideoView } from “@whereby.com/browser-sdk”;

function MyPreCallUX() {
    const localMedia = useLocalMedia({ audio: false, video: true });

    const { currentCameraDeviceId, cameraDevices, localStream } = localMedia.state;
    const { setCameraDevice, toggleCameraEnabled } = localMedia.actions;
    const { VideoView } = components;

    return <div className="preCallView">
        { /* Render any UI, making use of state */ }
        { cameraDevices.map((d) => (
            <p
                key={d.deviceId}
                onClick={() => {
                    if (d.deviceId !== currentCameraDeviceId) {
                        setCameraDevice(d.deviceId);
                    }
                }}
            >
                {d.label}
            </p>
        )) }
        <VideoView muted stream={localStream} />
    </div>;
}

```

#### useRoomConnection

The `useRoomConnection` hook provides a way to connect participants in a given room, subscribe to state updates, and perform actions on the connection, like toggling camera or microphone.

```js
import { useRoomConnection } from “@whereby.com/browser-sdk”;

function MyCallUX( { roomUrl, localStream }) {
    const { state, actions, components } = useRoomConnection(
        "<room_url>"
        {
            localMedia: null, // Supply localMedia from `useLocalMedia` hook, or constraints
            localMediaConstraints: {
                audio: true,
                video: true,
            }
        }
    );

    const { connectionState, remoteParticipants } = state;
    const { toggleCamera, toggleMicrophone } = actions;
    const { VideoView } = components;

    return <div className="videoGrid">
        { /* Render any UI, making use of state */ }
        { remoteParticipants.map((p) => (
            <VideoView key={p.id} stream={p.stream} />
        )) }
    </div>;
}

```

### Web component for embedding

Use the `<whereby-embed />` web component to make use of Whereby's pre-built responsive UI. Refer to our [documentation](https://docs.whereby.com/embedding-rooms/in-a-web-page/using-the-whereby-embed-element) to learn which attributes are supported.

#### React

```js
import "@whereby.com/browser-sdk";

const MyComponent = ({ roomUrl }) => {
    return <whereby-embed chat="off" room={roomUrl} />;
};

export default MyComponent;
```

#### In plain HTML

```html
<html>
    <head>
        <script src="...."></script>
    </head>
    <body>
        <div class="container">
            <whereby-embed room="<room_url>" />
        </div>
    </body>
</html>
```

**Note**

Although we have just higlighted two combinations of how to load and use the web component, it should be possible to use this library with all the major frontend frameworks.
