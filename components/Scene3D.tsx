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

function Controls() {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const { camera, gl } = useThree();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isControlActive, setIsControlActive] = useState(false);
  const [mouseMoved, setMouseMoved] = useState(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotationInactiveRef = useRef(false);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      // 마우스 또는 터치 이벤트 처리
      let clientX, clientY;
      
      if ('touches' in e) {
        // 터치 이벤트인 경우
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // 마우스 이벤트인 경우
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      
      // 화면 중앙 기준으로 -1에서 1 사이의 값으로 정규화
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;
      
      // 마우스 움직임 감지 
      const deltaX = Math.abs(x - lastMousePosRef.current.x);
      const deltaY = Math.abs(y - lastMousePosRef.current.y);
      
      // 일정 임계값 이상 움직였을 때만 마우스 움직임으로 간주
      if (deltaX > 0.01 || deltaY > 0.01) {
        setMouseMoved(true);
        
        // OrbitControl이 비활성화된 상태에서 마우스가 움직였을 때만 회전 재개
        if (!isControlActive && rotationInactiveRef.current) {
          rotationInactiveRef.current = false;
        }
      }
      
      lastMousePosRef.current = { x, y };
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    
    // 컨트롤이 동작하는 이벤트를 감지하여 isControlActive 상태 업데이트
    const handlePointerDown = () => {
      setIsControlActive(true);
    };
    
    const handlePointerUp = () => {
      // 일정 시간 후에 컨트롤 비활성화 (드래그 후 관성 효과가 끝난 후)
      setTimeout(() => {
        setIsControlActive(false);
        // 컨트롤이 끝난 직후에는 마우스 위치 기반 회전을 비활성화
        rotationInactiveRef.current = true;
        // 마우스 움직임 상태 초기화
        setMouseMoved(false);
      }, 500);
    };
    
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isControlActive]);
  
  useFrame(() => {
    if (controlsRef.current && !isControlActive && !rotationInactiveRef.current && mouseMoved) {
      // OrbitControls 제약 내에서 마우스/터치 위치 기반 회전 적용
      const minAzimuth = -Math.PI / 6;
      const maxAzimuth = Math.PI / 8;
      const minPolar = Math.PI / 2.8;
      const maxPolar = Math.PI * .46;
      
      // mousePosition 값을 이용해 제약 범위 내에서 회전 계산 (회전 효과 감소)
      // 0.5 -> 0.2로 변경하여 회전 효과 감소
      const targetAzimuth = minAzimuth + (mousePosition.x * 0.1 + 0.5) * (maxAzimuth - minAzimuth);
      const targetPolar = minPolar + (mousePosition.y * 0.1 + 0.5) * (maxPolar - minPolar);
      
      // 부드러운 회전을 위해 현재 값에서 목표 값으로 보간
      const currentAzimuth = controlsRef.current.getAzimuthalAngle();
      const currentPolar = controlsRef.current.getPolarAngle();
      
      // 현재 각도에서 목표 각도로 부드럽게 보간 (더 천천히 변경)
      const newAzimuth = THREE.MathUtils.lerp(currentAzimuth, targetAzimuth, 0.02); // 0.05 -> 0.03으로 변경
      const newPolar = THREE.MathUtils.lerp(currentPolar, targetPolar, 0.02); // 0.05 -> 0.03으로 변경
      
      // 수동으로 카메라 위치 업데이트
      const phi = newPolar;
      const theta = newAzimuth;
      const radius = 10; // 카메라와 타겟 사이의 거리
      
      // 구면 좌표계 -> 데카르트 좌표계 변환
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      
      camera.lookAt(0, 0, 0);
    }
    
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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  
  useEffect(() => {
    // 초기 크기 설정
    updateSize();
    
    // 화면 크기가 변경될 때마다 크기 업데이트
    window.addEventListener('resize', updateSize);
    
    // 마우스 다운/업 이벤트 리스너
    const handleMouseDown = () => setIsGrabbing(true);
    const handleMouseUp = () => setIsGrabbing(false);
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);
  
  const updateSize = () => {
    const minDimension = Math.min(window.innerWidth, window.innerHeight);
    setSize({
      width: minDimension,
      height: minDimension
    });
  };

  return (
    <div className={`w-screen h-screen bg-white flex items-center justify-center`}>
      <div 
        style={{ 
          width: `${size.width}px`, 
          height: `${size.height}px`, 
          position: 'relative',
          cursor: isGrabbing ? 'grabbing' : 'grab'
        }}
      >
        <Canvas gl={{ toneMapping: THREE.ACESFilmicToneMapping }} shadows="soft">
          <SoftShadows 
            size={25} 
            samples={16} 
            focus={0.5} 
          />
          <PerspectiveCamera makeDefault position={[0,1,10]} fov={10} />
          <Controls />
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
        </Canvas>
        
        {/* 로고 컨테이너 - 배경 블러 효과 적용 */}
        <div className="absolute bottom-3 right-3 z-[10000] mix-blend-screen">
          {/* 로고 링크 - mix-blend-mode: difference 적용 */}
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