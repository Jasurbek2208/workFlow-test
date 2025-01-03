import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner' // Add QrScanner for QR code scanning
import * as faceapi from 'face-api.js' // Open source face recognition library

export default function ComingGoingMovement(): JSX.Element {
	const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null)
	const [geoError, setGeoError] = useState<string | null>(null)
	const [isFrontCamera, setIsFrontCamera] = useState(true)
	const [flashlightEnabled, setFlashlightEnabled] = useState(false)
	const [faceDetected, setFaceDetected] = useState(false)
	const [faceRecognized, setFaceRecognized] = useState(false) // Track whether a known face was recognized
	const [qrCodeData, setQrCodeData] = useState<string | null>(null)
	const [isValidQRCode, setIsValidQRCode] = useState(false)

	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const qrScannerRef = useRef<QrScanner | null>(null)

	// Start camera video
	const startVideo = async (facingMode: 'user' | 'environment') => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
		}

		try {
			const constraints: MediaStreamConstraints = {
				video: { facingMode },
			}
			const stream = await navigator?.mediaDevices.getUserMedia(constraints)
			streamRef.current = stream
			if (videoRef.current) {
				videoRef.current.srcObject = stream
				videoRef.current.play()
			}
		} catch (err) {
			console.error('Error accessing webcam:', err)
		}
	}

	useEffect(() => {
		const initializeFaceApi = async () => {
			await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
			await faceapi.nets.faceRecognitionNet.loadFromUri('/models') // Load face recognition model
		}
		initializeFaceApi()
	}, [])

	useEffect(() => {
		startVideo(isFrontCamera ? 'user' : 'environment')
	}, [isFrontCamera, flashlightEnabled])

	const detectFace = async () => {
		if (videoRef.current) {
			const detection = await (faceapi?.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())?.withFaceLandmarks() as any)?.withFaceDescriptors()
			if (detection) {
				setFaceDetected(true)
				captureSnapshot('face')

				// Compare detected face to known faces (e.g., saved faces in your system)
				const labeledFaceDescriptors = await getLabeledFaceDescriptors()
				const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
				const bestMatch = faceMatcher.findBestMatch(detection.descriptor)

				if (bestMatch.label === 'knownFace') {
					setFaceRecognized(true)
					console.log('Known face detected.')
				} else {
					setFaceRecognized(false)
					console.log('Unknown face detected.')
				}

				setTimeout(() => setIsFrontCamera(false), 1000) // Switch to back camera after face detection
			}
		}
	}

	const captureSnapshot = (type: 'face' | 'qrcode') => {
		if (videoRef.current && canvasRef.current) {
			const canvas = canvasRef.current
			const context = canvas.getContext('2d')
			if (context) {
				canvas.width = videoRef.current.videoWidth
				canvas.height = videoRef.current.videoHeight
				context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
				console.log(`${type} snapshot captured.`)
			}
		}
	}

	const getLabeledFaceDescriptors = async () => {
		// Replace with actual implementation to load labeled face descriptors (i.e., known faces)
		// Example: fetching from a server or local storage
		return [] // Return an array of labeled face descriptors
	}

	const scanQRCode = () => {
		if (videoRef.current) {
			qrScannerRef.current = new QrScanner(videoRef.current, (result) => {
				setQrCodeData(result)
				validateQRCode(result)
			})
			qrScannerRef.current.start()
		}
	}

	const validateQRCode = (scannedData: string) => {
		const staticQRCodeId = 'VALID_QR_CODE_ID' // Replace with dynamic ID in the future
		if (scannedData === staticQRCodeId) {
			setIsValidQRCode(true)
			console.log('QR Code validated.')
		} else {
			setIsValidQRCode(false)
			console.error('Invalid QR Code.')
		}
	}

	const requestGeoLocation = async () => {
		if (!navigator?.geolocation) {
			setGeoError('Geolocation is not supported by your browser.')
			return
		}

		navigator?.geolocation?.getCurrentPosition(
			(position) => {
				setGeoLocation({
					lat: position.coords.latitude,
					lon: position.coords.longitude,
				})
				setGeoError(null)
			},
			(error: any) => {
				const errorMessages = {
					1: 'Permission denied. Please enable location services.',
					2: 'Position unavailable. Please try again.',
					3: 'Request timed out. Please retry.',
				}
				setGeoError((errorMessages as any)?.[error?.code] || 'Unknown geolocation error occurred.')
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
		)
	}

	useEffect(() => {
		requestGeoLocation()
	}, [])

	return (
		<div className='pt-6 max-w-[500px] h-full mx-auto'>
			<h1 className='mt-3 mb-6 text-lg text-center font-semibold text-gray-600 uppercase'>Coming-Going Movement</h1>

			{geoError && <p className='text-red-500'>{geoError}</p>}

			{geoLocation && (
				<p className='mt-4'>
					Location: {geoLocation?.lat}, {geoLocation?.lon}
				</p>
			)}

			<video ref={videoRef} autoPlay muted className='w-[300px] h-auto my-0 mx-auto rounded-full border-[4px] border-[#0369a1]'></video>
			<canvas ref={canvasRef} style={{ display: 'none' }} />

			<div className='mt-8'>
				{!faceDetected && (
					<button onClick={detectFace} className='w-full text-sm px-5 py-2.5 text-white font-medium rounded-lg bg-[#0369a1] hover:bg-[#024d74]'>
						Detect Face
					</button>
				)}

				{faceDetected && !qrCodeData && !faceRecognized && (
					<button onClick={scanQRCode} className='w-full text-sm px-5 py-2.5 text-white font-medium rounded-lg bg-[#0369a1] hover:bg-[#024d74]'>
						Scan QR Code
					</button>
				)}

				{faceRecognized && <p className='mt-4 text-green-500'>Known face detected!</p>}
				{!faceRecognized && faceDetected && <p className='mt-4 text-yellow-500'>Unknown face detected.</p>}

				{qrCodeData && isValidQRCode && <p className='mt-4 text-green-500'>QR Code is valid!</p>}
				{qrCodeData && !isValidQRCode && <p className='mt-4 text-red-500'>Invalid QR Code.</p>}
			</div>

			{streamRef.current && (
				<button onClick={() => setFlashlightEnabled(!flashlightEnabled)} className='w-full text-sm px-5 py-2.5 mt-4 text-white font-medium rounded-lg bg-[#0369a1] hover:bg-[#024d74]'>
					{flashlightEnabled ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
				</button>
			)}
		</div>
	)
}