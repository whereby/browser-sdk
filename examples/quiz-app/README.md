# Quiz Game Example App

This was a hackathon project orientated around using Whereby's public [Browser
SDK](https://github.com/whereby/browser-sdk). We created a Jackbox-esque quiz
game with working audio and video tiles for the players.

## Architecture

We decided to experiment and see if a many-to-many game connection was
possible, using Whereby's socketIO connection, rather than deploying a separate
game server and frontend.

The game state (questions, answers, scores etc.) are sent via JSON in the
underlying Whereby room's chat functionality (and abstracted from this game).

Therefore no server was required. The static frontend was deployed to\
https://hackday-sdk-demo.netlify.app/

## Setup

```
yarn
yarn start
```

Runs the app in the development mode.\ Open
[http://localhost:3000](http://localhost:3000) to view it in the browser.

> 👑 One player will need to be the quiz master (or party leader) to start the
> game. They can join using the query parameter
> [http://localhost:3000?quizMaster=true](http://localhost:3000?quizMaster=true)

### Libraries

This project was bootstrapped with [Create React
App](https://github.com/facebook/create-react-app), using the
[Redux](https://redux.js.org/) and [Redux
Toolkit](https://redux-toolkit.js.org/) TS template.

The project also uses [ChakraUI](https://chakra-ui.com/) components and
[Framer](https://www.framer.com/motion/) for animation.

## Configuration

Currently, there is a single Whereby room which hosts this game. This could be
expanded to generate transient rooms like Jackbox does, for example. For now -
Putting your own Whereby room in the [config](./frontend/src/config/room.ts)
will allow the sdk to connect with your own parameters.
