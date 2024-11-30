import { useEffect, useRef, useState } from 'react'

export default function App(): JSX.Element {
	const [geoLocation, setGeoLocation] = useState<{
		lat: number
		lon: number
	} | null>(null)
	const [backPhoto, setBackPhoto] = useState<string | null>(null)
	const [frontPhoto, setFrontPhoto] = useState<string | null>(null)
	const [isFrontCamera, setIsFrontCamera] = useState(false)
	const [isDone, setIsDone] = useState(false)

	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		// Request Geo-location
		navigator?.geolocation?.getCurrentPosition(
			(position) => {
				setGeoLocation({
					lat: position?.coords?.latitude || 0,
					lon: position?.coords?.longitude || 0,
				})
			},
			(error) => console.error('Geo-location error:', error),
			{ enableHighAccuracy: true },
		)
	}, [])

	useEffect(() => {
		const startVideo = async () => {
			try {
				const stream = await navigator?.mediaDevices?.getUserMedia({
					video: { facingMode: isFrontCamera ? 'user' : 'environment' },
				})

				if (videoRef?.current) {
					videoRef.current.srcObject = stream
				}
			} catch (err) {
				console.error('Error accessing webcam:', err)
			}
		}

		startVideo()
	}, [isFrontCamera])

	const captureSnapshot = () => {
		if (videoRef?.current && canvasRef?.current) {
			const canvas = canvasRef?.current
			const context = canvas?.getContext('2d')
			if (context) {
				canvas.width = videoRef?.current?.videoWidth
				canvas.height = videoRef?.current?.videoHeight
				context?.drawImage(videoRef?.current, 0, 0, canvas?.width, canvas?.height)
				return canvas?.toDataURL('image/png')
			}
		}
		return null
	}

	const handleCaptureSequence = async () => {
		// Capture back camera snapshot
		const backSnapshot = captureSnapshot()
		if (backSnapshot) setBackPhoto(backSnapshot)

		// Wait briefly to allow camera toggle
		setTimeout(() => {
			setIsFrontCamera(true)
		}, 1000)

		// Wait for camera to toggle to the front
		setTimeout(() => {
			const frontSnapshot: string | null = captureSnapshot()
			if (frontSnapshot) setFrontPhoto(frontSnapshot)
			setIsDone(true)
		}, 3000)
	}

	return (
		<div className='pt-6 max-w-[500px] h-full mx-auto -translate-x-4'>
			<TitleText title='Camera' />
			<video ref={videoRef} autoPlay muted className='w-[100px] h-auto my-0 mx-auto'></video>

			<div className='mt-8'>
				<Button onClick={captureSnapshot} className='w-full'>
					Capture Snapshot
				</Button>
				<canvas ref={canvasRef} style={{ display: 'none' }} />
				{frontPhoto && <img src={frontPhoto} alt='Captured snapshot' className='mt-4 w-32' />}
				{frontPhoto && <img src={frontPhoto} alt='Front camera snapshot' className='mt-4 w-32' />}
				<p className='mt-4'>
					Location: {geoLocation?.lat}, {geoLocation?.lon}
				</p>
			</div>
		</div>
	)
}