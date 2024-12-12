import * as faceapi from 'face-api.js'

export const initializeFaceApi = async () => {
	await faceapi?.nets?.tinyFaceDetector?.loadFromUri('/models')
	await faceapi?.nets?.faceLandmark68Net?.loadFromUri('/models')
	await faceapi?.nets?.faceRecognitionNet?.loadFromUri('/models')
}

export const detectFace = async (videoElement: any) => {
	const detection = await faceapi?.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
	return detection
}