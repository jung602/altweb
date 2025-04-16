import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, PerspectiveCamera, useHelper, SoftShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, useEffect, useState } from 'react'

function RarerowModel() {
  const { scene } = useGLTF('/models/rarerow/1.glb')
  // 모델이 그림자를 받고 생성하도록 설정
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return <primitive object={scene} scale={.6} position={[-.4, -.55, 1]} rotation={[0,3,0]} />
}

function Lights() {
  const lightRef = useRef<THREE.DirectionalLight>(null!)
 /** useHelper(lightRef, THREE.DirectionalLightHelper, 1, 'red') */
  
  return (
    <directionalLight 
      ref={lightRef}
      position={[-5, 3, -7]} 
      intensity={0}
      castShadow
    />
  )
}

function CameraRotation({ onRotationChange }: { onRotationChange: (rotation: number) => void }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // 오일러 각도로 변환하여 Y축 회전값(azimuth)을 계산
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    const degrees = THREE.MathUtils.radToDeg(euler.y);
    onRotationChange(Math.round(degrees));
  });
  
  return null;
}

const Scene3D = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    // 초기 크기 설정
    updateSize();
    
    // 화면 크기가 변경될 때마다 크기 업데이트
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const updateSize = () => {
    const minDimension = Math.min(window.innerWidth, window.innerHeight);
    setSize({
      width: minDimension,
      height: minDimension
    });
  };

  return (
    <div className={`w-screen h-screen bg-black flex items-center justify-center`}>
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '16px',
          zIndex: 1000
        }}
      >
        회전 각도: {rotation}°
      </div>
      <div style={{ width: `${size.width}px`, height: `${size.height}px`, position: 'relative' }}>
        <Canvas gl={{ toneMapping: THREE.ACESFilmicToneMapping }} shadows="soft">
          <SoftShadows 
            size={25} 
            samples={16} 
            focus={0.5} 
          />
          <PerspectiveCamera makeDefault position={[0,1,5]} fov={20} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            rotateSpeed={0.5}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI * .5}
            target={[0, 0, 0]}
            position={[-1, 0, -1]}
          />
          <Lights />
          <directionalLight 
            position={[-5, 3, -7]} 
            intensity={1}
            castShadow
          />
                    <directionalLight 
            position={[-5, 3, 7]} 
            intensity={1}
            castShadow
          />
          <RarerowModel />
          <CameraRotation onRotationChange={setRotation} />
        </Canvas>
      </div>
    </div>
  )
}

export default Scene3D

useGLTF.preload('/models/rarerow/1.glb') 