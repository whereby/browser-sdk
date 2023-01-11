# @whereby.com/browser-sdk

Clientside library defining a web component to allow embedding Whereby video rooms in web applications. Only normal iframe under the hood, the web component adds syntactic sugar to make it easier to customize the Whereby experience and hook into powerful features such as listening to room events and sending commands to the room from the host application.

## Usage

### React + a bundler (webpack, rollup, parcel etc)
```
import "@whereby.com/browser-sdk"

const MyComponent = ({ roomUrl }) => {
    return <whereby-embed room={roomUrl} />
}

export default MyComponent

```

### Directly using a script tag
```
<html>
    <head>
        <script src="...."></script>
    </head>
    <body>
        <div class="container">
            <whereby-embed room="some-room" />
        </div>
    </body>
</html>
```

**Note**

Although we have just higlighted two combinations of how to load and use the web component, it should be possible to use this library with all the major frontend frameworks.