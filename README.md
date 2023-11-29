# Introduction

Whereby offers a straightforward API that allows for the creation of virtual meeting spaces called rooms. Rooms are where video calls (sessions) take place and can be embedded on your platform in a variety of ways.

We've created multiple offerings within our SDK to provide you the tools to create the best video experience for your users. 

For more in depth information about our product you can visit our developer documentation:
[https://docs.whereby.com/](https://docs.whereby.com/whereby-101/create-your-video-experience)

## Web Component

<a href="https://www.npmjs.com/package/@whereby.com/browser-sdk" alt="NPM Package">
    <img src="https://img.shields.io/npm/v/@whereby.com/browser-sdk" />
</a>
<br>
<br>
Clientside library defining a web component to allow embedding Whereby video
rooms in web applications. A standard iframe under the hood, the web component
adds syntactic sugar to make it easier to customize the Whereby experience and
hook into powerful features such as listening to room events and sending
commands to the room from the host application.
<br>
<br>

> [!IMPORTANT]
> #### React Hooks (Beta)
> We're currently working on a library for use within React applications for a more customizable experience. Take a look at [the development branch](https://github.com/whereby/browser-sdk/tree/development) if you'd like to test it out. 
<br><br>**Disclaimer**: This is a beta release, and we recommend using it with caution in production environments. Your feedback and contributions are greatly appreciated.


## Usage

### React + a bundler (webpack, rollup, parcel etc)

```js
import "@whereby.com/browser-sdk"

const MyComponent = ({ roomUrl }) => {
    return <whereby-embed room={roomUrl} />
}

export default MyComponent

```

### Directly using a script tag

```html
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

Although we have just higlighted two combinations of how to load and use the
web component, it should be possible to use this library with all the major
frontend frameworks.

