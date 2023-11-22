const OUTPUT_WIDTH = 320;
const IMAGE_TYPE = "image/jpeg";

export type Base64Image = string | ArrayBuffer;
function getBase64ImageFromBlob(blob: Blob): Promise<Base64Image | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        const cb = () => {
            reader.removeEventListener("load", cb);
            resolve(reader.result);
        };
        reader.addEventListener("load", cb);
        reader.readAsDataURL(blob);
    });
}

function getScaledDimensions(videoElement: HTMLVideoElement) {
    const { videoWidth, videoHeight } = videoElement;
    const videoAspectRatio = videoWidth / videoHeight;
    const width = OUTPUT_WIDTH;
    const height = Math.floor(OUTPUT_WIDTH / videoAspectRatio);

    // safeguard against malicious usage
    if (height > 2000) {
        throw new Error("Invalid image dimension");
    }
    return { width, height };
}

function getCanvas(video: HTMLVideoElement) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const { width, height } = getScaledDimensions(video);
    canvas.width = width;
    canvas.height = height;
    if (context) {
        context.drawImage(video, 0, 0, width, height);
    }

    return canvas;
}

// avoid floating point errors; 1 - 0.1 - 0.1 - 0.1 === 0.7000000000000001
function subtract(a: number, b: number) {
    return Number.parseFloat(Number.parseFloat(`${a - b}`).toFixed(1));
}

async function captureSnapshot(video: HTMLVideoElement) {
    const canvas = getCanvas(video);

    for (let quality = 1.0; quality > 0; quality = subtract(quality, 0.1)) {
        const base64image: Base64Image | null = await new Promise((resolve) => {
            canvas.toBlob((blob) => (blob ? resolve(getBase64ImageFromBlob(blob)) : null), IMAGE_TYPE, quality);
        });
        const size = base64image instanceof ArrayBuffer ? base64image.byteLength : base64image?.length;
        if (size && size < 60000) {
            return base64image;
        }
    }

    throw new Error("Unable to create image from stream");
}

function captureStillImageFromStream(track: MediaStreamTrack): Promise<Base64Image | null> {
    return new Promise((resolve, reject) => {
        // This dance is done to align this API with the ImageCapture API,
        // provide some sort of polyfill-ish thing.
        // https://developers.google.com/web/updates/2016/12/imagecapture
        const mediaStream = new MediaStream();
        mediaStream.addTrack(track);
        const video = document.createElement("video");
        video.srcObject = mediaStream;

        let timeout: ReturnType<typeof setTimeout> | null = null;
        const onPlaying = async () => {
            if (timeout) {
                clearTimeout(timeout);
            }

            video.removeEventListener("playing", onPlaying);
            video.pause();

            try {
                const base64image = await captureSnapshot(video);
                resolve(base64image);
            } catch (e) {
                reject(e);
            } finally {
                video.srcObject = null;
                mediaStream.removeTrack(track);
            }
        };
        const onError = (msg: string) => () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            video.removeEventListener("playing", onPlaying);
            video.srcObject = null;
            mediaStream.removeTrack(track);
            reject(new Error(msg));
        };
        video.addEventListener("playing", onPlaying);
        video.setAttribute("playsinline", ""); // avoid fullscreen on iOS
        video.muted = true;
        const p = video.play();
        if (p) {
            p.catch(onError("Unable to start camera to take picture"));
        }

        // corner case: if track is present, but it's not loading (laptop lid closed)
        // .. neither load nor error events will be emitted
        // Wait long enough for CI to pass
        timeout = setTimeout(onError("Camera stream unavailable"), 3000); // CI uses between 50ms-2000ms before playing is emitted
    });
}

export default async function camCapture(videoStream: MediaStream) {
    const track = videoStream.getVideoTracks()[0];
    if (!track) {
        throw new Error("Camera stream unavailable");
    }
    return await captureStillImageFromStream(track);
}
