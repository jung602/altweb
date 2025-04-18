import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, PerspectiveCamera, useHelper, SoftShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, useEffect, useState } from 'react'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import Image from 'next/image'

function RarerowModel() {
  const { scene } = useGLTF('/models/rarerow/1.glb')
  
  // 모델이 그림자를 받고 생성하도록 설정
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return <primitive object={scene} scale={.6} position={[-.35, -.55, 1]} rotation={[0, (Math.PI * 3) - 0.1 ,0]} />
}


function Controls() {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  
  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={false} 
      enablePan={false}
      rotateSpeed={0.5}
      minAzimuthAngle={-Math.PI / 6}
      maxAzimuthAngle={Math.PI / 8}
      minPolarAngle={Math.PI / 2.8}
      maxPolarAngle={Math.PI * .46}
      target={[0,0,0]}
      enableDamping={true}
      dampingFactor={0.01}
    />
  );
}

const Scene3D = () => {
  const [isGrabbing, setIsGrabbing] = useState(false);
  
  useEffect(() => {
    // 마우스 다운/업 이벤트 리스너
    const handleMouseDown = () => setIsGrabbing(true);
    const handleMouseUp = () => setIsGrabbing(false);
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-white flex items-center justify-center">
      <div 
        className="w-full max-h-[100dvh] aspect-[4/3] relative"
        style={{ 
          cursor: isGrabbing ? 'grabbing' : 'grab',
          maxWidth: 'calc(100dvh * 4 / 3)'
        }}
      >
        <Canvas gl={{ toneMapping: THREE.ACESFilmicToneMapping }} shadows="soft">
          <SoftShadows 
            size={25} 
            samples={16} 
            focus={0.5} 
          />
          <PerspectiveCamera makeDefault position={[0,1,10]} rotation={[0, 0, 0]} fov={10} />
          <Controls />
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
        </Canvas>
        
        {/* 로고 컨테이너 - z-인덱스 9900 (로딩보다 낮게, 캔버스보다 높게) */}
        <div className="absolute bottom-3 right-3 z-[9900] mix-blend-screen">
          <a 
            href="https://www.altroom3d.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block backdrop-blur-md opacity-60 hover:opacity-90 transition-opacity"
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logowhite.png`}
              alt="Logo"
              width={54}
              height={54}
              priority
              className="w-auto h-[48px]"
            />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Scene3D

useGLTF.preload('/models/rarerow/1.glb') 