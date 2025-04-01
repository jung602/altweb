import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

const Scene3D = () => {
  return (
    <div style={{ width: '100%', height: '100vh', background: 'black' }}>
      <Canvas>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </Canvas>
    </div>
  )
}

export default Scene3D 