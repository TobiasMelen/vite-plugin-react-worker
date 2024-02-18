
import { Canvas } from '@react-three/offscreen'

// This is the worker thread that will render the scene
const worker = new Worker(new URL('./worker.tsx', import.meta.url), { type: 'module' })

export default function App() {
  return (
    <Canvas
      fallback={<ErrorOnFallback />}
      worker={worker}
      shadows 
      camera={{ position: [0, 5, 10], fov: 25 }} />
  )
}


function ErrorOnFallback():null{
  throw new Error("Offscreen canvas is not being used/supported.")
}