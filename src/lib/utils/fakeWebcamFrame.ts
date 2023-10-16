let rotationAngle = 0;

function drawWebcamFrame(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
        console.error("Canvas context not available");
        return;
    }
    const wheelRadius = 100;
    const wheelCenterX = canvas.width / 2;
    const wheelCenterY = canvas.height / 2;

    context.fillStyle = "darkgreen";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(wheelCenterX, wheelCenterY);
    context.rotate(rotationAngle);

    const numSlices = 12;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const colors = ["red", "orange", "yellow", "green", "blue", "purple"];

    for (let i = 0; i < numSlices; i++) {
        context.beginPath();
        context.moveTo(0, 0);
        context.arc(0, 0, wheelRadius, i * sliceAngle, (i + 1) * sliceAngle);
        context.fillStyle = colors[i % colors.length];
        context.fill();
        context.closePath();
    }

    context.restore();

    context.fillStyle = "white";
    context.font = "42px Arial";
    const topText = "Whereby Media Stream";
    const topTextWidth = context.measureText(topText).width;
    context.fillText(topText, canvas.width / 2 - topTextWidth / 2, 50);

    context.font = "32px Arial";

    const now = new Date();
    const timeText = `time: ${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now
        .getMilliseconds()
        .toString()
        .padStart(3, "0")}`;

    context.fillText(timeText, 10, canvas.height - 20);

    context.fillText(
        `rotation angle: ${rotationAngle.toFixed(2)}`,
        canvas.width - canvas.width / 2,
        canvas.height - 20
    );

    rotationAngle += 0.01;
}

export default function fakeWebcamFrame(canvas: HTMLCanvasElement) {
    drawWebcamFrame(canvas);
    requestAnimationFrame(() => fakeWebcamFrame(canvas));
}
