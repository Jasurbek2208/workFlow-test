import { useEffect, useRef, useState } from 'react'

export default function App(): JSX.Element {
	const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null)
	const [backPhoto, setBackPhoto] = useState<string | null>(null)
	const [frontPhoto, setFrontPhoto] = useState<string | null>(null)
	const [isFrontCamera, setIsFrontCamera] = useState(false)
	const [isDone, setIsDone] = useState(false)

	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)

	useEffect(() => {
		// Request Geo-location
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setGeoLocation({
					lat: position.coords.latitude || 0,
					lon: position.coords.longitude || 0,
				})
			},
			(error) => console.error('Geo-location error:', error),
			{ enableHighAccuracy: true },
		)
	}, [])

	const startVideo = async (facingMode: 'user' | 'environment') => {
		// Stop any existing stream
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

	const handleCaptureSequence = async () => {
		// Capture back camera snapshot
		const backSnapshot = captureSnapshot()
		if (backSnapshot) setBackPhoto(backSnapshot)

		// Switch to front camera
		setIsFrontCamera(true)

		// Wait for the front camera to initialize
		setTimeout(() => {
			const frontSnapshot = captureSnapshot()
			if (frontSnapshot) setFrontPhoto(frontSnapshot)
			setIsDone(true)
		}, 2000) // Adjust timing as needed for camera initialization
	}

	return (
		<div className='pt-6 max-w-[500px] h-full mx-auto -translate-x-4'>
			<h1>Camera</h1>
			<video ref={videoRef} autoPlay muted className='w-[300px] h-auto my-0 mx-auto'></video>

			<div className='mt-8'>
				{!isDone && (
					<button type='button' onClick={handleCaptureSequence} className='w-full'>
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