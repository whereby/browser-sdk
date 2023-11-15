/**
 * This is a hook to manage the state of the game.
 * Depends on the room connection state.
 */

import { useEffect, useReducer, useState } from "react";
import { useLocalMedia, useRoomConnection } from "@whereby.com/browser-sdk/react";

import questions from "./config/questions";
// This is a hack, need to expose this type directly from the SDK
export type RoomConnectionRef = ReturnType<typeof useRoomConnection>;
export type LocalMediaRef = ReturnType<typeof useLocalMedia>;

interface Question {
    question: string;
    alternatives: QuestionAlternatives;
    correctAlternative: string;
}

interface QuestionAlternatives {
    [alternativeId: string]: string;
}

export interface GameState {
    isQuizMaster: boolean;
    scores: {
        [participantId: string]: number;
    };
    screen: "welcome" | "question" | "end";
    currentAnswers: {
        [participantId: string]: string;
    } | null;
    currentQuestion: Question | null;
    revealAnswers: boolean;
}

export interface GameActions {
    start(): void;
    end(): void;
    nextQuestion(): void;
    postAnswer(alternative: string): void;
    postQuestion(question: Question): void;
    revealAnswers(): void;
}

type GameEvents =
    | {
          type: "QUESTION";
          payload: Question;
          senderId: string;
      }
    | {
          type: "ANSWER";
          payload: string;
          senderId: string;
      }
    | {
          type: "REVEAL";
          senderId: string;
      }
    | {
          type: "END";
          senderId: string;
      };

const initialState: GameState = {
    isQuizMaster: false,
    currentAnswers: null,
    currentQuestion: null,
    revealAnswers: false,
    scores: {},
    screen: "welcome",
};

function calculateScores(state: GameState): {
    [participantId: string]: number;
} {
    const { currentQuestion, scores, currentAnswers = {} } = state;
    if (!(currentQuestion && currentAnswers)) {
        return scores;
    }

    const newScores = {
        ...scores,
    };

    Object.keys(currentAnswers).forEach((participantId) => {
        const answer = currentAnswers[participantId];
        const participantScore = scores[participantId] || 0;
        newScores[participantId] = participantScore + (answer === currentQuestion.correctAlternative ? 1 : 0);
    });

    return newScores;
}

function reducer(state: GameState, event: GameEvents): GameState {
    switch (event.type) {
        case "QUESTION":
            return {
                ...state,
                screen: "question",
                currentAnswers: {},
                revealAnswers: false,
                currentQuestion: event.payload,
            };
        case "ANSWER":
            return {
                ...state,
                currentAnswers: {
                    ...state.currentAnswers,
                    [event.senderId]: event.payload,
                },
            };
        case "REVEAL":
            return {
                ...state,
                revealAnswers: true,
                scores: calculateScores(state),
            };
        case "END":
            return {
                ...state,
                screen: "end",
                currentAnswers: {},
                currentQuestion: null,
                revealAnswers: false,
            };
        default:
            console.log("Unknown command", event);
            return state;
    }
}

export default function useQuizGame(
    roomConnection: RoomConnectionRef,
    { isQuizMaster }: { isQuizMaster: boolean }
): {
    state: GameState;
    actions: GameActions;
} {
    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        isQuizMaster,
    });
    const { state: roomState, actions: roomActions } = roomConnection;
    const [questionCounter, setQuestionCounter] = useState(1);
    const mostRecentChatMessage = roomState.chatMessages[roomState.chatMessages.length - 1];

    useEffect(() => {
        if (mostRecentChatMessage) {
            try {
                const event = JSON.parse(mostRecentChatMessage.text);
                event.senderId = mostRecentChatMessage.senderId;
                dispatch(event);
            } catch (error) {
                console.log("Invalid command, ignoring");
            }
        }
    }, [mostRecentChatMessage]);

    return {
        state,
        actions: {
            start() {
                // Separate type or just straight to question
                roomActions.sendChatMessage(JSON.stringify(questions[0]));
            },
            end() {
                if (!state.isQuizMaster) {
                    console.warn("Not authorized to end quiz");
                    return;
                }

                roomActions.sendChatMessage(
                    JSON.stringify({
                        type: "END",
                    })
                );
            },
            nextQuestion() {
                if (questionCounter > questions.length - 1) {
                    console.log("The quiz is over");
                    roomActions.sendChatMessage(
                        JSON.stringify({
                            type: "END",
                        })
                    );
                }

                setQuestionCounter(questionCounter + 1);
                roomActions.sendChatMessage(JSON.stringify(questions[questionCounter]));
            },

            // This will only be needed if we implement quiz-master UI
            postQuestion(question: Question) {
                if (!state.isQuizMaster) {
                    console.warn("Not authorized to post question");
                    return;
                }

                roomActions.sendChatMessage(
                    JSON.stringify({
                        type: "QUESTION",
                        payload: question,
                    })
                );
            },

            postAnswer(alternative: string) {
                roomActions.sendChatMessage(
                    JSON.stringify({
                        type: "ANSWER",
                        payload: alternative,
                    })
                );
            },

            // This will only be needed if we implement quiz-master UI
            revealAnswers() {
                // if (!state.isQuizMaster) {
                //   console.warn("Not authorized to reveal answers");
                //   return;
                // }

                roomActions.sendChatMessage(
                    JSON.stringify({
                        type: "REVEAL",
                    })
                );
            },
        },
    };
}
