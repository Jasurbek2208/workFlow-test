import { useEffect, useRef, useState } from 'react'

export default function App(): JSX.Element {
	const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null)
	const [geoError, setGeoError] = useState<string | null>(null)
	const [backPhoto, setBackPhoto] = useState<string | null>(null)
	const [frontPhoto, setFrontPhoto] = useState<string | null>(null)
	const [isFrontCamera, setIsFrontCamera] = useState(false)
	const [isDone, setIsDone] = useState(false)

	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)

	// Start camera video
	const startVideo = async (facingMode: 'user' | 'environment') => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode },
			})
			streamRef.current = stream
			if (videoRef.current) {
				videoRef.current.srcObject = stream
			}
		} catch (err) {
			console.error('Error accessing webcam:', err)
		}
	}

	useEffect(() => {
		startVideo(isFrontCamera ? 'user' : 'environment')
	}, [isFrontCamera])

	// Capture snapshot from the video stream
	const captureSnapshot = (): string | null => {
		if (videoRef.current && canvasRef.current) {
			const canvas = canvasRef.current
			const context = canvas.getContext('2d')
			if (context) {
				canvas.width = videoRef.current.videoWidth
				canvas.height = videoRef.current.videoHeight
				context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
				return canvas.toDataURL('image/png')
			}
		}
		return null
	}

	// Handle geolocation request
	const requestGeoLocation = async () => {
		if (!navigator?.geolocation) {
			setGeoError('Geolocation is not supported by your browser.')
			return
		}

		try {
			const permission = await navigator.permissions.query({ name: 'geolocation' })
			if (permission.state === 'denied') {
				setGeoError('Geolocation permission denied. Please enable it in your browser settings.')
				return
			}

			navigator.geolocation.getCurrentPosition(
				(position) => {
					setGeoLocation({
						lat: position.coords.latitude,
						lon: position.coords.longitude,
					})
					setGeoError(null)
				},
				(error) => {
					setGeoError(`Geolocation error: ${error.message}`)
				},
				{ enableHighAccuracy: true },
			)
		} catch (err) {
			console.error('Error requesting geolocation:', err)
			setGeoError('An unexpected error occurred while requesting geolocation.')
		}
	}

	useEffect(() => {
		requestGeoLocation()
	}, [])

	// Capture photo sequence
	const handleCaptureSequence = async () => {
		// Capture back camera snapshot
		const backSnapshot = captureSnapshot()
		if (backSnapshot) setBackPhoto(backSnapshot)

		// Switch to front camera
		setTimeout(() => {
			setIsFrontCamera(true)
		}, 1000)

		// Wait for the front camera to initialize
		setTimeout(() => {
			const frontSnapshot = captureSnapshot()
			if (frontSnapshot) setFrontPhoto(frontSnapshot)
			setIsDone(true)
		}, 3000)
	}

	return (
		<div className='pt-6 max-w-[500px] h-full mx-auto -translate-x-4'>
			<h1 className='mt-3 mb-6 text-lg text-center font-semibold text-gray-600 uppercase dark:text-gray-400'>Camera</h1>
			<video ref={videoRef} autoPlay muted className='w-[300px] h-auto my-0 mx-auto'></video>

			<div className='mt-8'>
				{!isDone && (
					<button
						type='button'
						onClick={handleCaptureSequence}
						className='w-full text-sm px-5 py-2.5 text-white text-center focus:ring-4 font-medium rounded-lg focus:outline-none disabled:opacity-85 bg-gray-600 hover:bg-gray-700 focus:ring-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700 disabled:hover:bg-gray-600 dark:disabled:hover:bg-gray-600'>
						Capture Snapshot
					</button>
				)}
				<canvas ref={canvasRef} style={{ display: 'none' }} />
				{backPhoto && <img src={backPhoto} alt='Back camera snapshot' className='mt-4 w-32' />}
				{frontPhoto && <img src={frontPhoto} alt='Front camera snapshot' className='mt-4 w-32' />}
				<p className='mt-4'>
					Location: {geoLocation?.lat}, {geoLocation?.lon}
				</p>
			</div>
		</div>
	)
}