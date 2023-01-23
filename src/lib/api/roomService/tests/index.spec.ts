// @ts-nocheck
import sinon from "sinon";
import OrganizationApiClient from "../../OrganizationApiClient";
import Response from "../../Response";
import RoomService from "../index";
import Room from "../../models/Room";
import Meeting from "../../models/Meeting";
import { itShouldThrowIfInvalid, itShouldRejectIfApiClientRejects, toJson } from "../../test/helpers";

describe("RoomService", () => {
    let organizationApiClient;
    let roomService;
    const defaultParams = { includeOnlyLegacyRoomType: "false" };

    beforeEach(() => {
        organizationApiClient = sinon.createStubInstance(OrganizationApiClient);
        roomService = new RoomService({
            organizationApiClient,
        });
    });

    describe("constructor", () => {
        itShouldThrowIfInvalid(
            "organizationApiClient",
            () =>
                new RoomService({
                    organizationApiClient: undefined,
                })
        );
    });

    describe("getRooms", () => {
        const url = "/room";
        const method = "GET";

        beforeEach(() => {
            organizationApiClient.request.resolves();
        });

        itShouldThrowIfInvalid("types", () => roomService.getRooms());

        function testGetRooms({ args, expectedTypes }) {
            it(`should call request with types = [${expectedTypes}]`, () => {
                roomService.getRooms(args);

                expect(organizationApiClient.request).to.have.been.calledWithExactly(url, {
                    method,
                    params: { types: expectedTypes, fields: "", ...defaultParams },
                });
            });

            it("should transform data correctly", async () => {
                const data = {
                    rooms: [{ roomName: "/first-room" }, { roomName: "/second-room" }],
                };
                const expectedResult = [new Room({ roomName: "/first-room" }), new Room({ roomName: "/second-room" })];
                organizationApiClient.request.resolves(new Response({ data }));

                const result = await roomService.getRooms(args);

                expect(result).to.eql(expectedResult);
            });
        }

        describe("when types are provided", () => {
            testGetRooms({ args: { types: ["team", "personal"], fields: [] }, expectedTypes: "team,personal" });
        });
    });

    describe("getRoom", () => {
        const roomName = "/some-random-name";
        const uri = `/rooms${roomName}`;
        const method = "GET";

        itShouldThrowIfInvalid("roomName", () => roomService.getRoom({}));
        // roomName must be a string
        itShouldThrowIfInvalid("roomName", () => roomService.getRoom({ roomName: 23 }));

        // roomName must begin with slash
        it("should throw if `roomName` doesn't begin with a forward slash", () => {
            const expectedException = "roomName must begin with a '/'";

            expect(() => {
                roomService.getRoom({ roomName: "room-should-begin-with-slash" });
            }).to.throw(expectedException);
        });

        it("should add the room name to the response body if response code is 2xx", () => {
            const data = {
                test: "data",
            };
            const expectedObj = new Room(Object.assign({}, data, { roomName }));
            organizationApiClient.request
                .withArgs(uri, { method, params: defaultParams })
                .resolves(new Response({ data }));

            return roomService.getRoom({ roomName }).then((result) => {
                expect(result).to.eql(expectedObj);
            });
        });

        it("should call request with correct params when called with fields", () => {
            const fields = ["some-field"];
            organizationApiClient.request.resolves({ data: {} });

            return roomService.getRoom({ roomName, fields }).then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(uri, {
                    method,
                    params: { fields: fields[0], ...defaultParams },
                });
            });
        });

        it("should set meeting if meeting is returned", () => {
            const mockMeeting = {
                meetingId: "10",
                roomName: "/some-room-name",
                roomUrl: "some-room-url",
                startDate: new Date(),
                endDate: new Date(),
                hostRoomUrl: "some-host-room-url",
                viewerRoomUrl: null,
            };
            const data = {
                meeting: toJson(mockMeeting),
            };
            const expectedObj = new Room({ roomName, meeting: new Meeting(mockMeeting) });
            organizationApiClient.request.resolves(new Response({ data }));

            return roomService.getRoom({ roomName }).then((result) => {
                expect(result).to.eql(expectedObj);
            });
        });

        it("should set isBanned to true if response code is 400 with error Banned room", async () => {
            const expectedObj = new Room({
                roomName,
                isBanned: true,
            });
            organizationApiClient.request
                .withArgs(uri, { method, params: { includeOnlyLegacyRoomType: "false" } })
                .returns(
                    Promise.reject(
                        new Response({
                            status: 400,
                            data: {
                                error: "Banned room",
                            },
                        })
                    )
                );

            const result = await roomService.getRoom({ roomName });

            expect(result).to.eql(expectedObj);
        });

        it("should return deduced room object if response code is 404", async () => {
            organizationApiClient.request.rejects(new Response({ status: 404 }));

            const result = await roomService.getRoom({ roomName });

            expect(result).to.eql(
                new Room({
                    roomName,
                    isClaimed: false,
                    legacyRoomType: "free",
                    mode: "normal",
                    product: {
                        categoryName: "personal_free",
                    },
                    type: "personal",
                })
            );
        });

        it("should return error message if response code is not 2xx, 403 or 404 and data.error exists", () => {
            const data = {
                error: "Some error message",
            };

            organizationApiClient.request.rejects(new Response({ status: 405, data }));

            return expect(roomService.getRoom({ roomName })).to.be.rejectedWith(Error, data.error);
        });

        it("should return error message if response code is not 2xx, 403 or 404 and data.error does not exist", () => {
            const errorMessage = "Could not fetch room information";

            organizationApiClient.request.rejects(new Response({ status: 505, data: null }));

            return expect(roomService.getRoom({ roomName })).to.be.rejectedWith(Error, errorMessage);
        });
    });

    describe("claimRoom", () => {
        const url = "/room/claim";
        const method = "POST";
        const type = "personal";
        const roomName = "/some-random-name";

        beforeEach(() => {
            organizationApiClient.request.resolves();
        });

        itShouldThrowIfInvalid("roomName", () => roomService.claimRoom({ type }));
        itShouldThrowIfInvalid("type", () => roomService.claimRoom({ roomName }));

        it("should reject with error containing the error message if available", () => {
            const expectedError = "some error";
            organizationApiClient.request.rejects(
                new Response({
                    status: 500,
                    data: {
                        error: expectedError,
                    },
                })
            );

            const promise = roomService.claimRoom({ roomName, type });

            return expect(promise).to.eventually.be.rejectedWith(Error, expectedError);
        });

        it("should reject with error 'Failed to claim room' if none is provided by the server", () => {
            organizationApiClient.request.rejects(
                new Response({
                    status: 500,
                    data: {},
                })
            );

            const promise = roomService.claimRoom({ roomName, type });

            return expect(promise).to.eventually.be.rejectedWith(Error, "Failed to claim room");
        });

        it("should call request with correct params if all arguments have been provided", () => {
            const isLocked = true;

            roomService.claimRoom({ roomName, type, isLocked });

            expect(organizationApiClient.request).to.have.been.calledWithExactly(url, {
                method,
                data: { roomName, type, isLocked },
            });
        });

        it("should call request with correct params if isLock is not provided", () => {
            roomService.claimRoom({ roomName, type });

            expect(organizationApiClient.request).to.have.been.calledWithExactly(url, {
                method,
                data: { roomName, type },
            });
        });
    });

    describe("unclaimRoom", () => {
        const roomName = "/some-room-name";

        itShouldThrowIfInvalid("roomName", () => {
            roomService.unclaimRoom(undefined);
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.unclaimRoom(roomName);
            }
        );

        it("should call request the expected parameters", () => {
            organizationApiClient.request.resolves(new Response({ status: 204 }));

            const promise = roomService.unclaimRoom(roomName);

            return promise.then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(
                    `/room/${encodeURIComponent(roomName.substring(1))}`,
                    {
                        method: "DELETE",
                    }
                );
            });
        });

        it("should resolve with undefined on success", async () => {
            organizationApiClient.request.resolves(new Response({ status: 204 }));

            const result = await roomService.unclaimRoom(roomName);

            expect(result).to.eql(undefined);
        });
    });

    describe("renameRoom", () => {
        const roomName = "/foo";
        const encodedRoomName = encodeURIComponent(roomName.substring(1));
        const url = `/room/${encodedRoomName}/roomName`;
        const newRoomName = "/bar";
        const data = { newRoomName };

        it("should call apiClient.request with the expected parameters", () => {
            organizationApiClient.request.resolves();

            return roomService.renameRoom({ roomName, newRoomName }).then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(url, { method: "PUT", data });
            });
        });

        it("should be resolved if apiClient.request resolves", async () => {
            organizationApiClient.request.resolves();

            const result = await roomService.renameRoom({ roomName, newRoomName });

            expect(result).to.eql(undefined);
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.renameRoom({ roomName, newRoomName });
            }
        );
    });

    describe("changeMode", () => {
        const roomName = "/foo";
        const encodedDisplayName = encodeURIComponent(roomName.substring(1));
        const url = `/room/${encodedDisplayName}/mode`;
        const method = "PUT";
        const mode = "group";
        const data = { mode };

        it("should call apiClient.request with the expected parameters", () => {
            organizationApiClient.request.resolves();

            return roomService.changeMode({ roomName, mode }).then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(url, { method, data });
            });
        });

        it("should be resolved if apiClient.request resolves", async () => {
            organizationApiClient.request.resolves();

            const result = await roomService.changeMode({ roomName, mode });

            expect(result).to.eql(undefined);
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.changeMode({ roomName, mode });
            }
        );
    });

    describe("getRoomPermissions", () => {
        const roomName = "/some-room-name";
        const permissions = {};
        const limits = {
            maxNumberOfClaimedRooms: null,
        };

        const roomPermissionsPayload = {
            permissions,
            limits,
        };

        itShouldThrowIfInvalid("roomName", () => {
            roomService.getRoomPermissions();
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.getRoomPermissions(roomName);
            }
        );

        describe("when roomKey is not provided", () => {
            it("should call request the expected parameters", () => {
                organizationApiClient.request.resolves(
                    new Response({
                        status: 200,
                        data: roomPermissionsPayload,
                    })
                );

                const promise = roomService.getRoomPermissions(roomName);

                return promise.then(() => {
                    expect(organizationApiClient.request).to.have.been.calledWithExactly(
                        `/room/${encodeURIComponent(roomName.substring(1))}/permissions`,
                        {
                            method: "GET",
                        }
                    );
                });
            });

            it("should resolve with undefined on success", async () => {
                organizationApiClient.request.resolves(
                    new Response({
                        status: 200,
                        data: roomPermissionsPayload,
                    })
                );

                const result = await roomService.getRoomPermissions(roomName);

                expect(result).to.eql(roomPermissionsPayload);
            });
        });

        describe("when roomKey is provided", () => {
            let roomKey;

            beforeEach(() => {
                roomKey = "some room key";
            });

            it("should call request the expected parameters", () => {
                organizationApiClient.request.resolves(
                    new Response({
                        status: 200,
                        data: roomPermissionsPayload,
                    })
                );

                const promise = roomService.getRoomPermissions(roomName, { roomKey });

                return promise.then(() => {
                    expect(organizationApiClient.request).to.have.been.calledWithExactly(
                        `/room/${encodeURIComponent(roomName.substring(1))}/permissions`,
                        {
                            method: "GET",
                            headers: {
                                "X-Whereby-Room-Key": roomKey,
                            },
                        }
                    );
                });
            });

            it("should resolve with undefined on success", async () => {
                organizationApiClient.request.resolves(
                    new Response({
                        status: 200,
                        data: roomPermissionsPayload,
                    })
                );

                const result = await roomService.getRoomPermissions(roomName, { roomKey });

                expect(result).to.eql(roomPermissionsPayload);
            });
        });
    });

    describe("getRoomMetrics", () => {
        const roomName = "/some-room-name";
        const metrics = "totalMeetings";
        const roomMetricsPayload = { roomName, metrics };

        itShouldThrowIfInvalid("roomName", () => {
            roomService.getRoomMetrics({});
        });

        itShouldThrowIfInvalid("metrics", () => {
            roomService.getRoomMetrics({ roomName });
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.getRoomMetrics(roomMetricsPayload);
            }
        );

        describe("when valid payload provided", () => {
            it("should call request the expected parameters", () => {
                organizationApiClient.request.resolves(
                    new Response({
                        status: 200,
                        data: {},
                    })
                );

                const promise = roomService.getRoomMetrics(roomMetricsPayload);

                return promise.then(() => {
                    expect(organizationApiClient.request).to.have.been.calledWithExactly(
                        `/room/${encodeURIComponent(roomName.substring(1))}/metrics`,
                        {
                            method: "GET",
                            params: { metrics, from: undefined, to: undefined },
                        }
                    );
                });
            });

            it("should call request the expected parameters when including from and to", () => {
                organizationApiClient.request.resolves(
                    new Response({
                        status: 200,
                        data: {},
                    })
                );

                const from = new Date().toISOString();
                const to = new Date().toISOString();
                const promise = roomService.getRoomMetrics({ ...roomMetricsPayload, from, to });

                return promise.then(() => {
                    expect(organizationApiClient.request).to.have.been.calledWithExactly(
                        `/room/${encodeURIComponent(roomName.substring(1))}/metrics`,
                        {
                            method: "GET",
                            params: { metrics, from, to },
                        }
                    );
                });
            });

            it("should resolve with response data on success", async () => {
                const responseData = Symbol();
                organizationApiClient.request.resolves(
                    new Response({
                        status: 200,
                        data: responseData,
                    })
                );

                const result = await roomService.getRoomMetrics(roomMetricsPayload);

                expect(result).to.eql(responseData);
            });
        });
    });

    describe("updatePreferences", () => {
        const roomName = "/foo";
        let preferences;

        beforeEach(() => {
            preferences = { bar: Symbol() };
        });

        itShouldThrowIfInvalid("roomName", () => roomService.updatePreferences({ preferences }));
        itShouldThrowIfInvalid("preferences", () => roomService.updatePreferences({ roomName }));

        it("should call apiClient.request with the expected parameters", () => {
            const encodedDisplayName = encodeURIComponent(roomName.substring(1));
            const url = `/room/${encodedDisplayName}/preferences`;
            organizationApiClient.request.resolves();

            return roomService.updatePreferences({ roomName, preferences }).then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(url, {
                    method: "PATCH",
                    data: preferences,
                });
            });
        });

        it("should be resolved if apiClient.request resolves", async () => {
            organizationApiClient.request.resolves();

            const result = await roomService.updatePreferences({ roomName, preferences });

            expect(result).to.eql(undefined);
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.updatePreferences({ roomName, preferences });
            }
        );
    });

    describe("updateProtectedPreferences", () => {
        const roomName = "/foo";
        let preferences;

        beforeEach(() => {
            preferences = { bar: Symbol() };
        });

        itShouldThrowIfInvalid("roomName", () => roomService.updateProtectedPreferences({ preferences }));
        itShouldThrowIfInvalid("preferences", () => roomService.updateProtectedPreferences({ roomName }));

        it("should call apiClient.request with the expected parameters", () => {
            const encodedDisplayName = encodeURIComponent(roomName.substring(1));
            const url = `/room/${encodedDisplayName}/protected-preferences`;
            organizationApiClient.request.resolves();

            return roomService.updateProtectedPreferences({ roomName, preferences }).then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(url, {
                    method: "PATCH",
                    data: preferences,
                });
            });
        });

        it("should be resolved if apiClient.request resolves", async () => {
            organizationApiClient.request.resolves();

            const result = await roomService.updateProtectedPreferences({ roomName, preferences });

            expect(result).to.eql(undefined);
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.updateProtectedPreferences({ roomName, preferences });
            }
        );
    });

    describe("changeType", () => {
        const roomName = "/foo";
        const encodedDisplayName = encodeURIComponent(roomName.substring(1));
        const url = `/room/${encodedDisplayName}/type`;
        const method = "PUT";
        const type = "personal";
        const data = { type };

        it("should call apiClient.request with the expected parameters", () => {
            organizationApiClient.request.resolves();

            return roomService.changeType({ roomName, type }).then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(url, { method, data });
            });
        });

        it("should be resolved if apiClient.request resolves", async () => {
            organizationApiClient.request.resolves();

            const result = await roomService.changeType({ roomName, type });

            expect(result).to.eql(undefined);
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.changeType({ roomName, type });
            }
        );
    });

    describe("getForestSocialImage", () => {
        const roomName = "/foo";
        const count = 24;
        const imageUrl = Symbol();

        itShouldThrowIfInvalid("roomName", () => roomService.getForestSocialImage({ count }));
        itShouldThrowIfInvalid("count", () => roomService.getForestSocialImage({ roomName }));

        it("should call apiClient.request with the expected parameters", () => {
            const encodedDisplayName = encodeURIComponent(roomName.substring(1));
            const url = `/room/${encodedDisplayName}/forest-social-image/${count}`;
            organizationApiClient.request.resolves({ data: { imageUrl } });

            return roomService.getForestSocialImage({ roomName, count }).then(() => {
                expect(organizationApiClient.request).to.have.been.calledWithExactly(url, {
                    method: "GET",
                });
            });
        });

        it("should resolve with imageUrl if apiClient.request resolves", async () => {
            organizationApiClient.request.resolves({ data: { imageUrl } });

            const result = await roomService.getForestSocialImage({ roomName, count });

            expect(result).to.eql(imageUrl);
        });

        itShouldRejectIfApiClientRejects(
            () => organizationApiClient,
            () => {
                return roomService.getForestSocialImage({ roomName, count });
            }
        );
    });
});
